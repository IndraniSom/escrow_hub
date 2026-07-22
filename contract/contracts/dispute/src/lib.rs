#![no_std]
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

    pub fn add_evidence(env: Env, dispute_id: u64, evidence_uri: Symbol) {
        env.invoker().require_auth();
        let _dispute: Dispute = env.storage().persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        let mut evidence: Vec<Symbol> = env.storage().persistent()
            .get(&DataKey::Evidence(dispute_id))
            .unwrap_or(vec![&env]);
        evidence.push_back(evidence_uri);
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
