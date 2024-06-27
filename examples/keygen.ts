import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();
console.log(
  `Here's your new wallet: ${keypair.publicKey.toBase58()} \n\n To save your wallet, copy and paste the following output into a JSON file: [${
    keypair.secretKey
  }]`
);