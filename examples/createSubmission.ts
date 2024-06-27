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
    CREATE_SUBMISSION_INSTRUCTION_LAYOUT,
    SUBMISSION_ACCOUNT_DATA_LAYOUT,
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

      const [submissionAccount] = PublicKey.findProgramAddressSync(
        [user.publicKey.toBuffer(), Buffer.from(formCode), Buffer.from("submissions")],
        new PublicKey(PROGRAM_ID)
      );
      
      console.log("Using form account: ", formAccount.toBase58());
      console.log("Using user account: ", user.publicKey.toBase58());
      console.log("Using program owner: ", programOwner.publicKey.toBase58());
  
      console.log("Start creating submission account.....");
  
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
            pubkey: user.publicKey,
            isSigner: true,
            isWritable: true, // so wrong, should be false
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
  
      const submissionAccountInfo = await connection.getAccountInfo(submissionAccount);
  
      if (!submissionAccountInfo) {
        console.error("Submission account info not found!!!!");
      } else {
        const submissionAccountState = SUBMISSION_ACCOUNT_DATA_LAYOUT.decode(
          submissionAccountInfo.data
        );
        console.log("Submission account state: ", submissionAccountState);
      }
    } catch (error) {
      console.error(error);
    }
  })();
  