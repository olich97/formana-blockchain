import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { start } from "solana-bankrun";
import * as borsh from "@project-serum/borsh";
import { describe, test } from "node:test";
import { assert } from "node:console";

const SUBMISSION_ACCOUNT_DATA_LAYOUT = borsh.struct([
  borsh.publicKey("form"),
  borsh.publicKey("author"),
  borsh.u64("timestamp"),
  borsh.str("content_url"),
  borsh.u8("bump"),
]);

const CREATE_SUBMISSION_INSTRUCTION_LAYOUT = borsh.struct([
  borsh.u8("variant"),
  borsh.str("content_url"),
]);

const CREATE_FORM_INSTRUCTION_LAYOUT = borsh.struct([
  borsh.u8("variant"),
  borsh.str("code"),
  borsh.str("schema_url"),
]);

const FORM_ACCOUNT_DATA_LAYOUT = borsh.struct([
  borsh.publicKey("creator"),
  borsh.str("code"),
  borsh.str("schema_url"),
  borsh.u8("bump"),
]);

describe("Form & Submission", async () => {
  const formCreator = Keypair.generate();
  const submissionAuthor = Keypair.generate();
  const PROGRAM_ID = PublicKey.unique();
  const formCode = "test1";
  const formSchemaUrl = "https://test1.com";
  const context = await start(
    [{ name: "formana_program", programId: PROGRAM_ID }],
    []
  );
  const client = context.banksClient;

  test("Create form", async () => {

    const payer = context.payer;
    const [formAccount] = PublicKey.findProgramAddressSync(
      [formCreator.publicKey.toBuffer(), Buffer.from(formCode)],
      new PublicKey(PROGRAM_ID)
    );
    console.log(`Program Address      : ${PROGRAM_ID}`);
    console.log(`Payer Address      : ${payer.publicKey}`);
    console.log(`Form Acct  : ${formAccount.toBase58()}`);

    const buffer = Buffer.alloc(1000);
    CREATE_FORM_INSTRUCTION_LAYOUT.encode(
      {
        variant: 0,
        code: formCode,
        schema_url: formSchemaUrl,
      },
      buffer
    );
    const instructionBuffer = buffer.subarray(
      0,
      CREATE_FORM_INSTRUCTION_LAYOUT.getSpan(buffer)
    );

    const transaction = new Transaction();
    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: formCreator.publicKey,
          isSigner: true,
          isWritable: false, // so wrong, need to check later
        },
        {
          pubkey: formAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      data: instructionBuffer,
      programId: new PublicKey(PROGRAM_ID),
    });
    const blockhash = context.lastBlockhash;
    transaction.recentBlockhash = blockhash;
    transaction.add(instruction);
    transaction.sign(payer, formCreator);
    await client.processTransaction(transaction);
  });

  test("Read form data", async () => {
    const [formAccount] = PublicKey.findProgramAddressSync(
      [formCreator.publicKey.toBuffer(), Buffer.from(formCode)],
      new PublicKey(PROGRAM_ID)
    );
    const formAccountData = await client.getAccount(formAccount);
    const readAccountData = FORM_ACCOUNT_DATA_LAYOUT.decode(
      Buffer.from(formAccountData?.data)
    );
    console.log(`Code: ${readAccountData.code}`);
    console.log(`Creator: ${readAccountData.creator}`);
    console.log(`Schem url: ${readAccountData.schema_url}`);

    assert(readAccountData.creator == formCreator.publicKey);
    assert(readAccountData.schema_url == formSchemaUrl);
    assert(readAccountData.code == formCode);
  });

  test("Create submission", async () => {
    const payer = context.payer;
    const [formAccount] = PublicKey.findProgramAddressSync(
      [formCreator.publicKey.toBuffer(), Buffer.from(formCode)],
      new PublicKey(PROGRAM_ID)
    );
    console.log(`Program Address      : ${PROGRAM_ID}`);
    console.log(`Payer Address      : ${payer.publicKey}`);
    console.log(`Form Acct  : ${formAccount.toBase58()}`);
    const [submissionAccount] = PublicKey.findProgramAddressSync(
      [
        submissionAuthor.publicKey.toBuffer(),
        Buffer.from(formCode),
        Buffer.from("submissions"),
      ],
      new PublicKey(PROGRAM_ID)
    );
    console.log(`Submission Acct  : ${submissionAccount.toBase58()}`);

    const buffer = Buffer.alloc(1000);
    CREATE_SUBMISSION_INSTRUCTION_LAYOUT.encode(
      {
        variant: 1,
        content_url: "https://example.com",
      },
      buffer
    );
    const instructionBuffer = buffer.subarray(
      0,
      CREATE_SUBMISSION_INSTRUCTION_LAYOUT.getSpan(buffer)
    );

    const transaction = new Transaction();
    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: submissionAuthor.publicKey,
          isSigner: true,
          isWritable: false, // so wrong, need to check later
        },
        {
          pubkey: formAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: submissionAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      data: instructionBuffer,
      programId: new PublicKey(PROGRAM_ID),
    });
    const blockhash = context.lastBlockhash;
    transaction.recentBlockhash = blockhash;
    transaction.add(instruction);
    transaction.sign(payer, submissionAuthor);
    await client.processTransaction(transaction);
  });

  test("Read submission data", async () => {
    const [submissionAccount] = PublicKey.findProgramAddressSync(
      [
        submissionAuthor.publicKey.toBuffer(),
        Buffer.from(formCode),
        Buffer.from("submissions"),
      ],
      new PublicKey(PROGRAM_ID)
    );
    const submissionAccountData = await client.getAccount(submissionAccount);
    const readAccountData = SUBMISSION_ACCOUNT_DATA_LAYOUT.decode(
      Buffer.from(submissionAccountData?.data)
    );
    console.log(`Content Url: ${readAccountData.content_url}`);
    console.log(`Author: ${readAccountData.author}`);
    console.log(`Form: ${readAccountData.form}`);
    console.log(`Timestamp: ${readAccountData.timestamp}`);
  });
});
