use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct Form {
    pub creator: Pubkey, // address of creator account
    pub code: String,    // a unique code for this form
    pub schema_url: String, // a reference to form schema stored off-chain
    pub encryption_key: Vec<u8>, // a public key used to encrypt form submissions
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct Submission {
    pub form: Pubkey,   // address of form account
    pub author: Pubkey, // address of who submitted the form
    pub timestamp: u64,
    pub content_url: String,
    pub symmetric_key: Vec<u8>,
    pub bump: u8,
}

impl Form {
    pub fn get_account_size(code: &str, schema_url: &str, encryption_key: &[u8]) -> usize {
        // Pubkey (creator): 32 bytes
        // String (code): 4 bytes for length + actual length
        // String (schema_url): 4 bytes for length + actual length
        // Vec<u8> (encryption_key): 4 bytes for length + actual length
        // u8 (bump): 1 byte
        32 + (4 + code.len()) + (4 + schema_url.len()) + (4 + encryption_key.len()) + 1
    }
}

impl Submission {
    pub fn get_account_size(content_url: &str, symmetric_key: &[u8]) -> usize {
        // Pubkey (form): 32 bytes
        // Pubkey (author): 32 bytes
        // u64 (timestamp): 8 bytes
        // String (content_url): 4 bytes for length + actual length
        // Vec<u8> (symmetric_key): 4 bytes for length + actual length
        // u8 (bump): 1 byte
        32 + 32 + 8 + (4 + content_url.len()) + (4 + symmetric_key.len()) + 1
    }
}
