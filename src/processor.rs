use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo}, borsh1::try_from_slice_unchecked, clock::Clock, entrypoint::ProgramResult, program::invoke_signed, program_error::ProgramError, pubkey::Pubkey, rent::Rent, system_instruction, sysvar::Sysvar
};

use crate::state::{Form, Submission};
use crate::{error::FormanaError, instruction::FormInstruction};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = FormInstruction::unpack(instruction_data)?;

        match instruction {
            FormInstruction::CreateForm { code, schema_url , encryption_key} => {
                Self::process_create_form(accounts, code, schema_url, encryption_key,  program_id)
            }
            FormInstruction::CreateSubmission { content_url, symmetric_key } => {
                Self::process_create_submission(accounts, content_url, symmetric_key, program_id)
            }
        }
    }

    /// Processes the `CreateForm` instruction.
    ///
    /// # Arguments
    ///
    /// * `accounts` - The accounts required for the instruction.
    /// * `code` - The code of the form.
    /// * `schema_url` - The URL of the schema.
    /// * `encryption_key` - Public key used to encrypt submissions
    /// * `program_id` - The ID of the program.
    ///
    /// # Returns
    ///
    /// A `ProgramResult` indicating the success or failure of the instruction processing.
    fn process_create_form(
        accounts: &[AccountInfo],
        code: String,
        schema_url: String,
        encryption_key: Vec<u8>,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        // Get the form creator account
        let authority_account = next_account_info(account_info_iter)?;

        // Get the target form account PDA
        let form_account = next_account_info(account_info_iter)?;

        let system_program = next_account_info(account_info_iter)?;

        // Get the fee payer account
        let payer_account = next_account_info(account_info_iter)?;

        // Form creator account must be a signer
        if !authority_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Determine the form account PDA
        let (form_pda, form_bump) = Pubkey::find_program_address(
            &[authority_account.key.as_ref(), code.as_ref()],
            program_id,
        );

        // Check if the derived form account matches the passed account
        if form_pda != *form_account.key {
            return Err(FormanaError::InvalidFormAccount.into());
        }

        // Calculate the size of the form account and rent details
        let form_size = Form::get_account_size(&code, &schema_url, &encryption_key);
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(form_size);

        let create_form_pda_ix = &system_instruction::create_account(
            payer_account.key,
            form_account.key,
            rent_lamports,
            form_size.try_into().unwrap(),
            program_id,
        );

        // Invoke the signed transaction to actually create the PDA account
        invoke_signed(
            create_form_pda_ix,
            &[
                payer_account.clone(),
                form_account.clone(),
                system_program.clone(),
            ],
            &[&[authority_account.key.as_ref(), code.as_ref(), &[form_bump]]],
        )?;

        let mut form_data = try_from_slice_unchecked::<Form>(&form_account.data.borrow()).unwrap();
        // Populate the form data
        form_data.creator = *authority_account.key;
        form_data.schema_url = schema_url;
        form_data.encryption_key = encryption_key;
        form_data.bump = form_bump;
        form_data.code = code;

        // Serialize the form data into the account data
        form_data.serialize(&mut &mut form_account.data.borrow_mut()[..])?;
        Ok(())
    }

    /// Processes the creation of a submission.
    ///
    /// # Arguments
    ///
    /// * `accounts` - The accounts passed to the program.
    /// * `content_url` - The URL of the content being submitted.
    /// * `symmetric_key` - Encrypted symmetric key used to encrypt submissions
    /// * `program_id` - The ID of the program.
    ///
    /// # Returns
    ///
    /// A `ProgramResult` indicating the success or failure of the operation.
    fn process_create_submission(
        accounts: &[AccountInfo],
        content_url: String,
        symmetric_key: Vec<u8>,
        program_id: &Pubkey,
    ) -> ProgramResult {
        // Get the account iterators
        let account_info_iter = &mut accounts.iter();

        // Get the submission creator account
        let authority_account = next_account_info(account_info_iter)?;

        // Get the target form account
        let form_account = next_account_info(account_info_iter)?;

        // Get the submission account derived from the PDA
        let submission_account = next_account_info(account_info_iter)?;

        // Get the system program account
        let system_program = next_account_info(account_info_iter)?;

        // Get the fee payer account
        let payer_account = next_account_info(account_info_iter)?;

        // Check if the authority account is a signer
        if !authority_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Check if the form account is writable and already initialized (not empty)
        if !form_account.is_writable || form_account.data_is_empty() {
            return Err(FormanaError::InvalidFormAccount.into());
        }

        // Get the form data from the form account
        let form_data = try_from_slice_unchecked::<Form>(&form_account.data.borrow()).unwrap();

        // Derive the submission account PDA
        let (submission_pda, submission_bump) = Pubkey::find_program_address(
            &[
                authority_account.key.as_ref(),
                form_data.code.as_ref(),
                "submissions".as_ref(),
            ],
            program_id,
        );

        // Check if the derived submission account matches the passed account
        if submission_pda != *submission_account.key {
            return Err(FormanaError::InvalidSubmissionAccount.into());
        }

        // Calculate the size of the submission account and rent details
        let submission_size = Submission::get_account_size(&content_url, &symmetric_key);
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(submission_size);

        let create_submission_pda_ix = &system_instruction::create_account(
            payer_account.key, // Use payer account to pay for the transaction
            submission_account.key,
            rent_lamports,
            submission_size.try_into().unwrap(),
            program_id,
        );

        // Invoke the signed transaction to actually create the PDA account
        invoke_signed(
            create_submission_pda_ix,
            &[
                payer_account.clone(),
                submission_account.clone(),
                system_program.clone(),
            ],
            &[&[
                authority_account.key.as_ref(),
                form_data.code.as_ref(),
                "submissions".as_ref(),
                &[submission_bump],
            ]],
        )?;

        // Get the current clock timestamp
        let clock = Clock::get()?;

        // Initialize the submission data
        let mut submission_data =
            try_from_slice_unchecked::<Submission>(&submission_account.data.borrow()).unwrap();

        // Populate the submission data
        submission_data.form = *form_account.key;
        submission_data.author = *authority_account.key;
        submission_data.content_url = content_url;
        submission_data.bump = submission_bump;
        submission_data.symmetric_key = symmetric_key;
        submission_data.timestamp = clock.unix_timestamp as u64;

        // Serialize the submission data into the account data
        submission_data.serialize(&mut &mut submission_account.data.borrow_mut()[..])?;

        Ok(())
    }
}
