#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, vec, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reputation {
    pub total_projects: u32,
    pub completed_projects: u32,
    pub total_earned: i128,
    pub average_rating: u32,
    pub on_time_completion_rate: u32,
    pub dispute_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub id: u64,
    pub from: Address,
    pub to: Address,
    pub project_id: u64,
    pub rating: u32,
    pub comment: Symbol,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Reputation(Address),
    Reviews(Address),
    ReviewCount,
    RatingTotal(Address),
    RatingCount(Address),
    Owner,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().persistent().set(&DataKey::Owner, &admin);
    }

    pub fn initialize_reputation(env: Env, address: Address) {
        if env.storage().persistent().has(&DataKey::Reputation(address.clone())) {
            panic!("reputation already initialized");
        }

        let reputation = Reputation {
            total_projects: 0,
            completed_projects: 0,
            total_earned: 0,
            average_rating: 0,
            on_time_completion_rate: 0,
            dispute_count: 0,
        };

        env.storage().persistent().set(&DataKey::Reputation(address), &reputation);
    }

    pub fn submit_review(
        env: Env,
        from: Address,
        to: Address,
        project_id: u64,
        rating: u32,
        comment: Symbol,
    ) -> u64 {
        from.require_auth();

        if rating < 1 || rating > 5 {
            panic!("rating must be between 1 and 5");
        }

        let count: u64 = env.storage().persistent()
            .get(&DataKey::ReviewCount)
            .unwrap_or(0);
        let id = count + 1;

        let review = Review {
            id,
            from: from.clone(),
            to: to.clone(),
            project_id,
            rating,
            comment,
            created_at: env.ledger().timestamp(),
        };

        let mut reviews: Vec<Review> = env.storage().persistent()
            .get(&DataKey::Reviews(to.clone()))
            .unwrap_or(vec![&env]);
        reviews.push_back(review);
        env.storage().persistent().set(&DataKey::Reviews(to.clone()), &reviews);

        let mut reputation: Reputation = env.storage().persistent()
            .get(&DataKey::Reputation(to.clone()))
            .unwrap_or(Reputation {
                total_projects: 0,
                completed_projects: 0,
                total_earned: 0,
                average_rating: 0,
                on_time_completion_rate: 0,
                dispute_count: 0,
            });

        reputation.total_projects += 1;

        let total: u64 = env.storage().persistent()
            .get(&DataKey::RatingTotal(to.clone()))
            .unwrap_or(0);
        let count_ratings: u32 = env.storage().persistent()
            .get(&DataKey::RatingCount(to.clone()))
            .unwrap_or(0);

        let new_total = total + rating as u64;
        let new_count = count_ratings + 1;
        reputation.average_rating = (new_total / new_count as u64) as u32;

        env.storage().persistent().set(&DataKey::RatingTotal(to.clone()), &new_total);
        env.storage().persistent().set(&DataKey::RatingCount(to.clone()), &new_count);
        env.storage().persistent().set(&DataKey::Reputation(to.clone()), &reputation);
        env.storage().persistent().set(&DataKey::ReviewCount, &id);

        env.events().publish(
            (symbol_short!("review"), symbol_short!("submit")),
            (id, from, to, rating),
        );

        id
    }

    pub fn update_project_completion(env: Env, address: Address, completed: bool) {
        env.invoker().require_auth();
        let mut reputation: Reputation = env.storage().persistent()
            .get(&DataKey::Reputation(address.clone()))
            .expect("reputation not initialized");

        if completed {
            reputation.completed_projects += 1;
            reputation.on_time_completion_rate = if reputation.total_projects > 0 {
                (reputation.completed_projects * 100) / reputation.total_projects
            } else {
                0
            };
        }

        env.storage().persistent().set(&DataKey::Reputation(address.clone()), &reputation);

        env.events().publish(
            (symbol_short!("review"), symbol_short!("update")),
            (address, completed),
        );
    }

    pub fn increment_dispute_count(env: Env, address: Address) {
        env.invoker().require_auth();
        let mut reputation: Reputation = env.storage().persistent()
            .get(&DataKey::Reputation(address.clone()))
            .expect("reputation not initialized");

        reputation.dispute_count += 1;
        env.storage().persistent().set(&DataKey::Reputation(address.clone()), &reputation);

        env.events().publish(
            (symbol_short!("review"), symbol_short!("update")),
            (address, reputation.dispute_count),
        );
    }

    pub fn get_reputation(env: Env, address: Address) -> Reputation {
        env.storage().persistent()
            .get(&DataKey::Reputation(address))
            .unwrap_or(Reputation {
                total_projects: 0,
                completed_projects: 0,
                total_earned: 0,
                average_rating: 0,
                on_time_completion_rate: 0,
                dispute_count: 0,
            })
    }

    pub fn get_reviews(env: Env, address: Address) -> Vec<Review> {
        env.storage().persistent()
            .get(&DataKey::Reviews(address))
            .unwrap_or(vec![&env])
    }
}
