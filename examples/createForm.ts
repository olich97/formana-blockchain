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
  new Uint8Array([66,223,148,38,19,52,37,196,184,114,36,146,204,126,93,207,140,195,195,50,135,99,51,110,133,133,77,77,74,43,129,244,98,25,157,198,164,152,110,24,5,34,244,222,73,58,121,131,198,216,239,76,93,127,68,41,250,70,61,245,245,89,110,133])
);

(async () => {
  try {
    const connection = new Connection("http://localhost:8899", "confirmed");
    const formCode = "blog-122";

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
        encryption_key: Buffer.from([65, 109, 226, 128, 161, 93, 18, 230, 62, 74, 74, 131, 198, 30, 206, 56, 86, 133, 209, 98, 188, 176, 69, 14, 64, 45, 174, 161, 225, 234, 86, 54]),
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
        {
          pubkey: programOwner.publicKey,
          isSigner: true,
          isWritable: true
        }
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
      { commitment: "finalized", skipPreflight: true }
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
