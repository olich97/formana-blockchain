use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh1::try_from_slice_unchecked,
    clock::Clock,
    entrypoint::ProgramResult,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
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
            FormInstruction::CreateForm { code, schema_url } => {
                Self::process_create_form(accounts, code, schema_url, program_id)
            }
            FormInstruction::CreateSubmission { content_url } => {
                Self::process_create_submission(accounts, content_url, program_id)
            }
        }
    }

    fn process_create_form(
        accounts: &[AccountInfo],
        code: String,
        schema_url: String,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // aka Form creator account
        let authority_account = next_account_info(account_info_iter)?;
        // Account derived PDA
        let form_account = next_account_info(account_info_iter)?;
        //
        let system_program = next_account_info(account_info_iter)?;
         // Fee payer account
         let payer_account = next_account_info(account_info_iter)?; 

        // validations
        if !authority_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        // Form PDA is derived by using seeds: form code and form creator address
        let (form_pda, form_bump) = Pubkey::find_program_address(
            &[authority_account.key.as_ref(), code.as_ref()],
            program_id,
        );

        if form_pda != *form_account.key {
            return Err(FormanaError::InvalidFormAccount.into());
        }

        let form_size = Form::get_account_size(&code, &schema_url);
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(form_size);

        let create_form_pda_ix = &system_instruction::create_account(
            payer_account.key,
            form_account.key,
            rent_lamports,
            form_size.try_into().unwrap(),
            program_id,
        );

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
        form_data.creator = *authority_account.key;
        form_data.schema_url = schema_url;
        form_data.bump = form_bump;
        form_data.code = code;

        form_data.serialize(&mut &mut form_account.data.borrow_mut()[..])?;
        Ok(())
    }

    fn process_create_submission(
        accounts: &[AccountInfo],
        content_url: String,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // aka submission creator account
        let authority_account = next_account_info(account_info_iter)?;
        // Account derived PDA for target form
        let form_account = next_account_info(account_info_iter)?;
        // Account derived PDA
        let submission_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;
        // Fee payer account
        let payer_account = next_account_info(account_info_iter)?; 

        if !authority_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if !form_account.is_writable || form_account.data_is_empty() {
            return Err(FormanaError::InvalidFormAccount.into());
        }

        let form_data = try_from_slice_unchecked::<Form>(&form_account.data.borrow()).unwrap();

        let (submission_pda, submission_bump) = Pubkey::find_program_address(
            &[
                authority_account.key.as_ref(),
                form_data.code.as_ref(),
                "submissions".as_ref(),
            ],
            program_id,
        );

        if submission_pda != *submission_account.key {
            return Err(FormanaError::InvalidSubmissionAccount.into());
        }

        let submission_size = Submission::get_account_size(&content_url);
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(submission_size);

        let create_submission_pda_ix = &system_instruction::create_account(
            payer_account.key, // Use payer account to pay for the transaction
            submission_account.key,
            rent_lamports,
            submission_size.try_into().unwrap(),
            program_id,
        );

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

        let clock = Clock::get()?;
        let mut submission_data =
            try_from_slice_unchecked::<Submission>(&submission_account.data.borrow()).unwrap();
        submission_data.form = *form_account.key;
        submission_data.author = *authority_account.key;
        submission_data.content_url = content_url;
        submission_data.bump = submission_bump;
        submission_data.timestamp = clock.unix_timestamp as u64;

        submission_data.serialize(&mut &mut submission_account.data.borrow_mut()[..])?;
        Ok(())
    }
}
