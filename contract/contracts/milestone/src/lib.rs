#![cfg_attr(not(test), no_std)]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneState {
    Pending,
    InProgress,
    Completed,
    Approved,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u64,
    pub project_id: u64,
    pub title: Symbol,
    pub description: Symbol,
    pub amount: i128,
    pub state: MilestoneState,
    pub due_date: u64,
    pub completed_at: u64,
    pub submission_uri: Symbol,
}

#[contracttype]
pub enum DataKey {
    Milestone(u64),
    ProjectMilestones(u64),
    MilestoneCount,
    Owner,
}

#[contract]
pub struct MilestoneContract;

#[contractimpl]
impl MilestoneContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Owner, &admin);
    }

    pub fn create_milestone(
        env: Env,
        project_id: u64,
        title: Symbol,
        description: Symbol,
        amount: i128,
        due_date: u64,
    ) -> u64 {
        let count: u64 = env.storage().persistent()
            .get(&DataKey::MilestoneCount)
            .unwrap_or(0);
        let id = count + 1;

        let milestone = Milestone {
            id,
            project_id,
            title,
            description,
            amount,
            state: MilestoneState::Pending,
            due_date,
            completed_at: 0,
            submission_uri: Symbol::new(&env, ""),
        };

        env.storage().persistent().set(&DataKey::Milestone(id), &milestone);

        let mut project_milestones: Vec<u64> = env.storage().persistent()
            .get(&DataKey::ProjectMilestones(project_id))
            .unwrap_or(vec![&env]);
        project_milestones.push_back(id);
        env.storage().persistent()
            .set(&DataKey::ProjectMilestones(project_id), &project_milestones);

        env.storage().persistent().set(&DataKey::MilestoneCount, &id);

        env.events().publish(
            (symbol_short!("mile"), symbol_short!("create")),
            (id, project_id),
        );

        id
    }

    pub fn start_milestone(env: Env, caller: Address, milestone_id: u64) {
        caller.require_auth();
        let mut milestone: Milestone = env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found");

        if milestone.state != MilestoneState::Pending {
            panic!("milestone must be pending");
        }

        milestone.state = MilestoneState::InProgress;
        env.storage().persistent().set(&DataKey::Milestone(milestone_id), &milestone);

        env.events().publish(
            (symbol_short!("mile"), symbol_short!("start")),
            (milestone_id,),
        );
    }

    pub fn submit_milestone(env: Env, caller: Address, milestone_id: u64, submission_uri: Symbol) {
        caller.require_auth();
        let mut milestone: Milestone = env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found");

        if milestone.state != MilestoneState::InProgress {
            panic!("milestone must be in progress");
        }

        milestone.state = MilestoneState::Completed;
        milestone.submission_uri = submission_uri;
        milestone.completed_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Milestone(milestone_id), &milestone);

        env.events().publish(
            (symbol_short!("mile"), symbol_short!("submit")),
            (milestone_id,),
        );
    }

    pub fn approve_milestone(env: Env, caller: Address, milestone_id: u64) {
        caller.require_auth();
        let mut milestone: Milestone = env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found");

        if milestone.state != MilestoneState::Completed {
            panic!("milestone must be completed");
        }

        milestone.state = MilestoneState::Approved;
        env.storage().persistent().set(&DataKey::Milestone(milestone_id), &milestone);

        env.events().publish(
            (symbol_short!("mile"), symbol_short!("approve")),
            (milestone_id,),
        );
    }

    pub fn reject_milestone(env: Env, caller: Address, milestone_id: u64) {
        caller.require_auth();
        let mut milestone: Milestone = env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found");

        if milestone.state != MilestoneState::Completed {
            panic!("milestone must be completed");
        }

        milestone.state = MilestoneState::Rejected;
        env.storage().persistent().set(&DataKey::Milestone(milestone_id), &milestone);

        env.events().publish(
            (symbol_short!("mile"), symbol_short!("reject")),
            (milestone_id,),
        );
    }

    pub fn get_milestone(env: Env, milestone_id: u64) -> Milestone {
        env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found")
    }

    pub fn get_project_milestones(env: Env, project_id: u64) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::ProjectMilestones(project_id))
            .unwrap_or(vec![&env])
    }

    pub fn get_milestone_state(env: Env, milestone_id: u64) -> u32 {
        let milestone: Milestone = env.storage().persistent()
            .get(&DataKey::Milestone(milestone_id))
            .expect("milestone not found");
        milestone.state as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    fn setup(env: &Env) -> (MilestoneContractClient, Address) {
        let admin = Address::generate(env);
        let contract_id = env.register(MilestoneContract, ());
        let client = MilestoneContractClient::new(env, &contract_id);
        client.initialize(&admin);
        (client, Address::generate(env))
    }

    #[test]
    fn test_full_approval_flow() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);
        let (milestones, freelancer) = setup(&env);

        let id = milestones.create_milestone(&1, &symbol_short!("Design"), &symbol_short!("UI"), &1_000_000, &2_000);
        assert_eq!(id, 1);
        assert_eq!(milestones.get_milestone(&id).state, MilestoneState::Pending);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| milestones.submit_milestone(&freelancer, &id, &symbol_short!("x"))));
        assert!(result.is_err(), "cannot submit a pending milestone");

        milestones.start_milestone(&freelancer, &id);
        assert_eq!(milestones.get_milestone(&id).state, MilestoneState::InProgress);

        milestones.submit_milestone(&freelancer, &id, &symbol_short!("pr_42"));
        assert_eq!(milestones.get_milestone(&id).state, MilestoneState::Completed);
        assert_eq!(milestones.get_milestone(&id).submission_uri, symbol_short!("pr_42"));
        assert_eq!(milestones.get_milestone(&id).completed_at, 1_000);

        milestones.approve_milestone(&freelancer, &id);
        assert_eq!(milestones.get_milestone(&id).state, MilestoneState::Approved);
        assert_eq!(milestones.get_milestone_state(&id), 3);
    }

    #[test]
    fn test_reject_flow() {
        let env = Env::default();
        env.mock_all_auths();
        let (milestones, freelancer) = setup(&env);

        let id = milestones.create_milestone(&1, &symbol_short!("Backend"), &symbol_short!("API"), &2_000_000, &0);
        milestones.start_milestone(&freelancer, &id);
        milestones.submit_milestone(&freelancer, &id, &symbol_short!("api"));
        milestones.reject_milestone(&freelancer, &id);
        assert_eq!(milestones.get_milestone(&id).state, MilestoneState::Rejected);
    }

    #[test]
    fn test_project_milestone_listing() {
        let env = Env::default();
        env.mock_all_auths();
        let (milestones, _) = setup(&env);

        milestones.create_milestone(&7, &symbol_short!("A"), &symbol_short!("a"), &100, &0);
        milestones.create_milestone(&7, &symbol_short!("B"), &symbol_short!("b"), &200, &0);
        milestones.create_milestone(&8, &symbol_short!("C"), &symbol_short!("c"), &300, &0);

        let project_7 = milestones.get_project_milestones(&7);
        assert_eq!(project_7.len(), 2);
        assert_eq!(project_7.get(0).unwrap(), 1);
        assert_eq!(project_7.get(1).unwrap(), 2);
    }
}
