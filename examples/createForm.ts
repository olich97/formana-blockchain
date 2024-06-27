import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import wallet from "./wallet.json";
import {
  CREATE_FORM_INSTRUCTION_LAYOUT,
  FORM_ACCOUNT_DATA_LAYOUT,
  PROGRAM_ID,
} from "./utils";
const user = Keypair.fromSecretKey(new Uint8Array(wallet));

import programOwnerPrivateKey from "/Users/olich/.config/solana/id.json";
const programOwner = Keypair.fromSecretKey(
  new Uint8Array(programOwnerPrivateKey)
);

(async () => {
  try {
    const connection = new Connection("http://localhost:8899", "confirmed");
    const formCode = "blog-3";

    const [formAccount] = PublicKey.findProgramAddressSync(
      [user.publicKey.toBuffer(), Buffer.from(formCode)],
      new PublicKey(PROGRAM_ID)
    );

    console.log("Using user account: ", user.publicKey.toBase58());
    console.log("Using program owner: ", programOwner.publicKey.toBase58());

    console.log("Start creating form account.....");

    const buffer = Buffer.alloc(1000);
    CREATE_FORM_INSTRUCTION_LAYOUT.encode(
      {
        variant: 0,
        code: formCode,
        schema_url: "https://example.com",
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
          pubkey: user.publicKey,
          isSigner: true,
          isWritable: true, // so wrong, need to check later
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
      ],
      data: instructionBuffer,
      programId: new PublicKey(PROGRAM_ID),
    });

    transaction.add(instruction);
    transaction.feePayer = programOwner.publicKey;

    const txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user, programOwner],
      { commitment: "finalized", skipPreflight: false }
    );

    console.log(`Success! Transaction submitted and finalized: ${txHash}`);

    const formAccountInfo = await connection.getAccountInfo(formAccount);

    if (!formAccountInfo) {
      console.error("Form account info not found!!!!");
    } else {
      const formAccountState = FORM_ACCOUNT_DATA_LAYOUT.decode(
        formAccountInfo.data
      );
      console.log("Form account state: ", formAccountState);
    }
  } catch (error) {
    console.error(error);
  }
})();
