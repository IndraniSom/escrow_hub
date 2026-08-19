#![cfg_attr(not(test), no_std)]
use soroban_sdk::{contract, contractimpl, contracttype, token, vec, Address, Env, IntoVal, Symbol, Val, Vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Funded,
    Active,
    Completed,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub amount: i128,
    pub state: EscrowState,
    pub milestone_count: u32,
    pub completed_milestones: u32,
    pub created_at: u64,
    pub expires_at: u64,
    pub milestone_contract: Address,
}

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    Owner,
    EscrowCount,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Owner, &admin);
    }

    pub fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
        milestone_count: u32,
        expires_at: u64,
        milestone_contract: Address,
    ) -> u64 {
        if milestone_count == 0 {
            panic!("milestone count must be positive");
        }
        client.require_auth();

        let count: u64 = env.storage().persistent().get(&DataKey::EscrowCount).unwrap_or(0);
        let id = count + 1;

        let escrow = Escrow {
            id,
            client: client.clone(),
            freelancer,
            token,
            amount,
            state: EscrowState::Funded,
            milestone_count,
            completed_milestones: 0,
            created_at: env.ledger().timestamp(),
            expires_at,
            milestone_contract,
        };

        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
        env.storage().persistent().set(&DataKey::EscrowCount, &id);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("create")),
            (id, client, escrow.freelancer.clone(), amount),
        );

        id
    }

    pub fn fund_escrow(env: Env, escrow_id: u64) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        escrow.client.require_auth();

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &escrow.client,
            &env.current_contract_address(),
            &escrow.amount,
        );

        escrow.state = EscrowState::Active;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("funded")),
            (escrow_id, escrow.amount),
        );
    }

    pub fn release_funds(env: Env, escrow_id: u64, milestone_id: u32) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        escrow.client.require_auth();

        let args: Vec<Val> = vec![&env, (milestone_id as u64).into_val(&env)];
        let milestone_state_val: Val = env.invoke_contract(
            &escrow.milestone_contract,
            &Symbol::new(&env, "get_milestone_state"),
            args,
        );
        let milestone_state: u32 = milestone_state_val.try_into().unwrap_or(0);
        if milestone_state != 3 {
            panic!("milestone not approved");
        }

        if escrow.state == EscrowState::Disputed {
            panic!("escrow is under dispute");
        }

        if escrow.milestone_count == 0 {
            panic!("escrow has no milestones");
        }
        let milestone_amount = escrow.amount / escrow.milestone_count as i128;
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.freelancer,
            &milestone_amount,
        );

        escrow.completed_milestones += 1;
        if escrow.completed_milestones >= escrow.milestone_count {
            escrow.state = EscrowState::Completed;
        }
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("release")),
            (escrow_id, milestone_id, milestone_amount),
        );
    }

    pub fn refund_escrow(env: Env, escrow_id: u64) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        escrow.client.require_auth();

        if escrow.state != EscrowState::Funded {
            panic!("escrow cannot be refunded in current state");
        }

        escrow.state = EscrowState::Refunded;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.client,
            &escrow.amount,
        );

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("refund")),
            (escrow_id, escrow.amount),
        );
    }

    pub fn dispute_escrow(env: Env, caller: Address, escrow_id: u64) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        if escrow.client != caller && escrow.freelancer != caller {
            panic!("only client or freelancer can dispute");
        }
        caller.require_auth();

        escrow.state = EscrowState::Disputed;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("dispute")),
            (escrow_id,),
        );
    }

    pub fn resolve_dispute(
        env: Env,
        escrow_id: u64,
        client_amount: i128,
        freelancer_amount: i128,
    ) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        let admin: Address = env.storage().persistent()
            .get(&DataKey::Owner)
            .expect("not initialized");
        admin.require_auth();

        if escrow.state != EscrowState::Disputed {
            panic!("escrow is not under dispute");
        }

        if client_amount < 0 || freelancer_amount < 0 {
            panic!("amounts cannot be negative");
        }
        if client_amount + freelancer_amount > escrow.amount {
            panic!("total exceeds escrow balance");
        }

        escrow.state = EscrowState::Completed;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        let token_client = token::Client::new(&env, &escrow.token);
        if client_amount > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &escrow.client,
                &client_amount,
            );
        }
        if freelancer_amount > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &escrow.freelancer,
                &freelancer_amount,
            );
        }

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("resolve")),
            (escrow_id, client_amount, freelancer_amount),
        );
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found")
    }

    pub fn get_escrow_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::EscrowCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, Env};

    fn setup(env: &Env) -> (EscrowContractClient, Address, Address, Address, token::Client, Address, Address) {
        let admin = Address::generate(env);
        let client = Address::generate(env);
        let freelancer = Address::generate(env);

        let token_admin = Address::generate(env);
        let token = env.register_stellar_asset_contract_v2(token_admin);
        let sac = token::StellarAssetClient::new(env, &token.address());
        sac.mint(&client, &1_000_000_000);

        let milestone_contract = env.register(milestone::MilestoneContract, ());
        let contract_id = env.register(EscrowContract, ());
        let escrow = EscrowContractClient::new(env, &contract_id);
        escrow.initialize(&admin);

        (escrow, client, freelancer, token.address(), token::Client::new(env, &token.address()), milestone_contract, contract_id)
    }

    #[test]
    fn test_create_and_fund_escrow() {
        let env = Env::default();
        env.mock_all_auths();
        let (escrow, client, freelancer, token, token_client, milestone_contract, contract_id) = setup(&env);

        let id = escrow.create_escrow(&client, &freelancer, &token, &1_000_000, &2, &0, &milestone_contract);
        assert_eq!(id, 1);

        let e = escrow.get_escrow(&id);
        assert_eq!(e.state, EscrowState::Funded);
        assert_eq!(e.milestone_count, 2);

        escrow.fund_escrow(&id);
        assert_eq!(escrow.get_escrow(&id).state, EscrowState::Active);
        assert_eq!(token_client.balance(&contract_id), 1_000_000);
        assert_eq!(token_client.balance(&client), 1_000_000_000 - 1_000_000);
    }

    #[test]
    fn test_release_requires_approved_milestone() {
        let env = Env::default();
        env.mock_all_auths();
        let (escrow, client, freelancer, token, token_client, milestone_contract, contract_id) = setup(&env);
        let milestones = milestone::MilestoneContractClient::new(&env, &milestone_contract);

        milestones.create_milestone(&1, &symbol_short!("Design"), &symbol_short!("UI"), &1_000_000, &1_000_000);
        let id = escrow.create_escrow(&client, &freelancer, &token, &1_000_000, &1, &0, &milestone_contract);
        escrow.fund_escrow(&id);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| escrow.release_funds(&id, &1)));
        assert!(result.is_err(), "release must fail before milestone is approved");

        milestones.start_milestone(&freelancer, &1);
        milestones.submit_milestone(&freelancer, &1, &symbol_short!("pr_42"));
        milestones.approve_milestone(&client, &1);
        assert_eq!(milestones.get_milestone_state(&1), 3);

        escrow.release_funds(&id, &1);
        assert_eq!(escrow.get_escrow(&id).state, EscrowState::Completed);
        assert_eq!(token_client.balance(&freelancer), 1_000_000);
        assert_eq!(token_client.balance(&contract_id), 0);
    }

    #[test]
    fn test_refund_only_when_funded() {
        let env = Env::default();
        env.mock_all_auths();
        let (escrow, client, freelancer, token, token_client, milestone_contract, contract_id) = setup(&env);

        let id = escrow.create_escrow(&client, &freelancer, &token, &500_000, &1, &0, &milestone_contract);
        escrow.fund_escrow(&id);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| escrow.refund_escrow(&id)));
        assert!(result.is_err(), "refund must fail after funding");

        let id2 = escrow.create_escrow(&client, &freelancer, &token, &500_000, &1, &0, &milestone_contract);
        escrow.refund_escrow(&id2);
        assert_eq!(escrow.get_escrow(&id2).state, EscrowState::Refunded);
        assert_eq!(token_client.balance(&client), 1_000_000_000);
        assert_eq!(token_client.balance(&contract_id), 0);
    }

    #[test]
    fn test_dispute_only_for_participants() {
        let env = Env::default();
        env.mock_all_auths();
        let (escrow, client, freelancer, token, _, milestone_contract, _) = setup(&env);
        let outsider = Address::generate(&env);

        let id = escrow.create_escrow(&client, &freelancer, &token, &1_000_000, &1, &0, &milestone_contract);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| escrow.dispute_escrow(&outsider, &id)));
        assert!(result.is_err(), "outsider must not be able to dispute");

        escrow.dispute_escrow(&freelancer, &id);
        assert_eq!(escrow.get_escrow(&id).state, EscrowState::Disputed);
    }

    #[test]
    fn test_resolve_dispute_split() {
        let env = Env::default();
        env.mock_all_auths();
        let (escrow, client, freelancer, token, token_client, milestone_contract, _) = setup(&env);

        let id = escrow.create_escrow(&client, &freelancer, &token, &1_000_000, &1, &0, &milestone_contract);
        escrow.fund_escrow(&id);
        escrow.dispute_escrow(&client, &id);

        escrow.resolve_dispute(&id, &600_000, &400_000);
        assert_eq!(escrow.get_escrow(&id).state, EscrowState::Completed);
        assert_eq!(token_client.balance(&client), 1_000_000_000 - 1_000_000 + 600_000);
        assert_eq!(token_client.balance(&freelancer), 400_000);
    }
}
