//#![cfg(feature = "test-bpf")]

use solana_program_test::*;

mod program_test;

use program_test::*;

use hapi_core_solana::state::enums::Category;
use std::collections::BTreeSet;

#[tokio::test]
async fn test_case_reported() {
    // Arrange
    let mut hapi_test = HapiProgramTest::start_new().await;
    let authority_keypair = hapi_test.create_funded_keypair().await;
    let network_cookie = hapi_test.with_network(&authority_keypair).await;
    let reporter_cookie = hapi_test
        .with_reporter(&network_cookie, &authority_keypair)
        .await
        .unwrap();

    let case_cookie = hapi_test.with_case(&network_cookie, &reporter_cookie).await;
    let category_set: BTreeSet<Category> = vec![Category::MiningPool, Category::Safe]
        .iter()
        .cloned()
        .collect();

    // Act
    hapi_test
        .update_case(
            &reporter_cookie.reporter_keypair,
            &network_cookie,
            &case_cookie,
            category_set.clone(),
        )
        .await
        .unwrap();

    // Assert
    let updated_account = hapi_test.get_case_account(&case_cookie.address).await;

    let mut actual_category_set: BTreeSet<Category> = BTreeSet::new();
    for (category, is_present) in updated_account.categories.iter() {
        if *is_present {
            actual_category_set.insert(*category);
        }
    }

    assert_eq!(24, std::mem::size_of_val(&actual_category_set));
    assert_eq!(actual_category_set, category_set);
}
