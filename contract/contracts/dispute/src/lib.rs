#![cfg_attr(not(test), no_std)]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeState {
    Open,
    UnderReview,
    Resolved,
    Dismissed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub id: u64,
    pub project_id: u64,
    pub raised_by: Address,
    pub reason: Symbol,
    pub description: Symbol,
    pub state: DisputeState,
    pub resolution: Symbol,
    pub created_at: u64,
    pub resolved_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Verdict {
    InFavorOfClient,
    InFavorOfFreelancer,
    Split,
    Dismissed,
}

#[contracttype]
pub enum DataKey {
    Dispute(u64),
    DisputeCount,
    Evidence(u64),
    Owner,
}

#[contract]
pub struct DisputeContract;

#[contractimpl]
impl DisputeContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Owner, &admin);
    }

    pub fn raise_dispute(
        env: Env,
        project_id: u64,
        raised_by: Address,
        client: Address,
        freelancer: Address,
        reason: Symbol,
        description: Symbol,
    ) -> u64 {
        raised_by.require_auth();

        if raised_by != client && raised_by != freelancer {
            panic!("only client or freelancer can raise a dispute");
        }

        let count: u64 = env.storage().persistent()
            .get(&DataKey::DisputeCount)
            .unwrap_or(0);
        let id = count + 1;

        let dispute = Dispute {
            id,
            project_id,
            raised_by: raised_by.clone(),
            reason,
            description,
            state: DisputeState::Open,
            resolution: Symbol::new(&env, ""),
            created_at: env.ledger().timestamp(),
            resolved_at: 0,
        };

        env.storage().persistent().set(&DataKey::Dispute(id), &dispute);
        env.storage().persistent().set(&DataKey::DisputeCount, &id);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("raise")),
            (id, project_id, raised_by),
        );

        id
    }

    pub fn add_evidence(env: Env, caller: Address, dispute_id: u64, evidence_uri: Symbol) {
        caller.require_auth();
        let dispute: Dispute = env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        if dispute.raised_by != caller {
            panic!("only the dispute raiser can add evidence");
        }

        let mut evidence: Vec<Symbol> = env.storage().persistent()
            .get(&DataKey::Evidence(dispute_id))
            .unwrap_or(vec![&env]);
        evidence.push_back(evidence_uri.clone());
        env.storage().persistent().set(&DataKey::Evidence(dispute_id), &evidence);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("evidence")),
            (dispute_id, evidence_uri),
        );
    }

    pub fn start_review(env: Env, dispute_id: u64) {
        let mut dispute: Dispute = env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        let admin: Address = env.storage().persistent()
            .get(&DataKey::Owner)
            .expect("not initialized");
        admin.require_auth();

        if dispute.state != DisputeState::Open {
            panic!("dispute must be open");
        }

        dispute.state = DisputeState::UnderReview;
        env.storage().persistent().set(&DataKey::Dispute(dispute_id), &dispute);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("review")),
            (dispute_id,),
        );
    }

    pub fn resolve_dispute(
        env: Env,
        dispute_id: u64,
        verdict: Verdict,
        client_amount: i128,
        freelancer_amount: i128,
        resolution: Symbol,
    ) {
        let mut dispute: Dispute = env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        let admin: Address = env.storage().persistent()
            .get(&DataKey::Owner)
            .expect("not initialized");
        admin.require_auth();

        if dispute.state != DisputeState::UnderReview && dispute.state != DisputeState::Open {
            panic!("dispute must be under review or open");
        }

        dispute.state = DisputeState::Resolved;
        dispute.resolution = resolution;
        dispute.resolved_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Dispute(dispute_id), &dispute);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("resolve")),
            (dispute_id, verdict, client_amount, freelancer_amount),
        );
    }

    pub fn dismiss_dispute(env: Env, dispute_id: u64, resolution: Symbol) {
        let mut dispute: Dispute = env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        let admin: Address = env.storage().persistent()
            .get(&DataKey::Owner)
            .expect("not initialized");
        admin.require_auth();

        dispute.state = DisputeState::Dismissed;
        dispute.resolution = resolution;
        dispute.resolved_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Dispute(dispute_id), &dispute);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("dismiss")),
            (dispute_id,),
        );
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Dispute {
        env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    fn setup(env: &Env) -> (DisputeContractClient, Address, Address, Address) {
        let admin = Address::generate(env);
        let contract_id = env.register(DisputeContract, ());
        let client = DisputeContractClient::new(env, &contract_id);
        client.initialize(&admin);
        (client, admin, Address::generate(env), Address::generate(env))
    }

    #[test]
    fn test_raise_and_evidence() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(5_000);
        let (disputes, _, client, freelancer) = setup(&env);

        let id = disputes.raise_dispute(&1, &client, &client, &freelancer, &symbol_short!("Late"), &symbol_short!("overdue"));
        assert_eq!(id, 1);
        assert_eq!(disputes.get_dispute(&id).state, DisputeState::Open);

        let outsider = Address::generate(&env);
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| disputes.add_evidence(&outsider, &id, &symbol_short!("doc_1"))));
        assert!(result.is_err(), "only the raiser may add evidence");

        disputes.add_evidence(&client, &id, &symbol_short!("doc_1"));
        disputes.add_evidence(&client, &id, &symbol_short!("doc_2"));
    }

    #[test]
    fn test_raise_rejected_for_outsider() {
        let env = Env::default();
        env.mock_all_auths();
        let (disputes, _, client, freelancer) = setup(&env);
        let outsider = Address::generate(&env);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            disputes.raise_dispute(&1, &outsider, &client, &freelancer, &symbol_short!("x"), &symbol_short!("y"))
        }));
        assert!(result.is_err());
    }

    #[test]
    fn test_review_resolve_and_dismiss() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(5_000);
        let (disputes, _, client, freelancer) = setup(&env);

        let id = disputes.raise_dispute(&2, &freelancer, &client, &freelancer, &symbol_short!("Unpaid"), &symbol_short!("delayed"));
        disputes.start_review(&id);
        assert_eq!(disputes.get_dispute(&id).state, DisputeState::UnderReview);

        disputes.resolve_dispute(&id, &Verdict::InFavorOfFreelancer, &0, &1_000_000, &symbol_short!("released"));
        let d = disputes.get_dispute(&id);
        assert_eq!(d.state, DisputeState::Resolved);
        assert_eq!(d.resolution, symbol_short!("released"));
        assert_eq!(d.resolved_at, 5_000);

        let id2 = disputes.raise_dispute(&3, &client, &client, &freelancer, &symbol_short!("Bad"), &symbol_short!("low_qual"));
        disputes.dismiss_dispute(&id2, &symbol_short!("no_evid"));
        assert_eq!(disputes.get_dispute(&id2).state, DisputeState::Dismissed);
        assert_eq!(disputes.get_dispute(&id2).resolution, symbol_short!("no_evid"));
    }
}
