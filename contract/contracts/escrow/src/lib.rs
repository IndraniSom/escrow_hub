#![no_std]
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

    pub fn dispute_escrow(env: Env, escrow_id: u64) {
        let mut escrow: Escrow = env.storage().persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");

        if escrow.client != env.invoker() && escrow.freelancer != env.invoker() {
            panic!("only client or freelancer can dispute");
        }
        env.invoker().require_auth();

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
