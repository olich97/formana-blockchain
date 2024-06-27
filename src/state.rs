use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct Form {
    pub creator: Pubkey, // address of creator account (waller the one who sign the tx?)
    pub code: String,    // a unique code for this form
    pub schema_url: String,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct Submission {
    pub form: Pubkey,   // address of form account
    pub author: Pubkey, // address of who submitted the form
    pub timestamp: u64,
    pub content_url: String,
    pub bump: u8,
}

impl Form {
    pub fn get_account_size(code: &str, schema_url: &str) -> usize {
        32 + (4 + code.len()) + (4 + schema_url.len()) + 1
    }
}

impl Submission {
    pub fn get_account_size(content_url: &str) -> usize {
        32 + 32 + 8 + (4 + content_url.len()) + 1
    }
}
