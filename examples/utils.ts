import * as borsh from "@project-serum/borsh";

export const FORM_ACCOUNT_DATA_LAYOUT = borsh.struct([
    borsh.publicKey("creator"),
    borsh.str("code"),
    borsh.str("schema_url"),
    borsh.vecU8("encryption_key"),
    borsh.u8("bump"),
  ]);
  
  export const SUBMISSION_ACCOUNT_DATA_LAYOUT = borsh.struct([
    borsh.publicKey("form"),
    borsh.publicKey("author"),
    borsh.u64("timestamp"),
    borsh.str("content_url"),
    borsh.u8("bump"),
  ]);

  export const CREATE_FORM_INSTRUCTION_LAYOUT = borsh.struct([
    borsh.u8('variant') ,
    borsh.str("code"),
    borsh.str("schema_url"),
    borsh.vecU8("encryption_key"),
  ]);
  
  export const CREATE_SUBMISSION_INSTRUCTION_LAYOUT = borsh.struct([
    borsh.u8('variant') ,
    borsh.str("content_url"),
  ]);

  export const PROGRAM_ID =
    "4zxAxWaxgNubr38Hb1hp2SAf8m3vqxvBz2wng6wNqaPv";
