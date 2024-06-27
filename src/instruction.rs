use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum FormInstruction {
    /// Accounts expected:
    ///
    /// 0. `[signer]` User account who is creating the form
    /// 1. `[writable]` From account derived from PDA
    /// 2. `[]` The System Program
    CreateForm { code: String, schema_url: String },
    /// Accounts expected:
    ///
    /// 0. `[signer]` User account who is creating the submission
    /// 1. `[writable]` Form account for which post is being created
    /// 2. `[writable]` Submission account derived from PDA
    /// 3. `[]` System Program
    CreateSubmission { content_url: String },
}

#[derive(BorshDeserialize)]
struct CreateFormPayload {
    code: String,
    schema_url: String,
}

#[derive(BorshDeserialize)]
struct CreateSubmissionPayload {
    content_url: String,
}

impl FormInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        Ok(match variant {
            0 => {
                let payload = CreateFormPayload::try_from_slice(rest).unwrap();
                Self::CreateForm {
                    code: payload.code,
                    schema_url: payload.schema_url,
                }
            }
            1 => {
                let payload = CreateSubmissionPayload::try_from_slice(rest).unwrap();
                Self::CreateSubmission {
                    content_url: payload.content_url,
                }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
        //FormInstruction::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)
    }
}
