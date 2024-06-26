use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum FormanaError {
    #[error("Invalid Instruction")]
    InvalidInstruction,

    #[error("Invalid Form Account")]
    InvalidFormAccount,

    #[error("Invalid Submission Account")]
    InvalidSubmissionAccount,

    #[error("Invalid Submission Data")]
    InvalidSubmissionData,

    #[error("Account not Writable")]
    AccountNotWritable,
}

impl From<FormanaError> for ProgramError {
    fn from(e: FormanaError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
