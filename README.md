# Formana Program

A [rust Solana onchain program](https://solana.com/docs/programs/lang-rust) for the [Formana](https://formana.olich.me/) platform. The program handles forms and submissions creation on Solana blockchain using [PDA accounts](https://solana.com/docs/core/pda).

## Prerequisites

- [Node](https://nodejs.org/en) v22+
- [Rustup](https://rustup.rs/) v1.22+
- [Rust](https://www.rust-lang.org/it) v1.79+
- [Yarn](https://yarnpkg.com/)
- [Solana Local Environment](https://solana.com/developers/guides/getstarted/setup-local-development)

## Getting Started

- Build: 
```bash
cargo build-bpf
# or
yarn build
```

- Run tests:
```bash
yarn test
```

- Deploy:
```bash
solana program deploy ./target/deploy/formana_program.so
# or
yarn deploy
```

- Use with local node:
```bash
# Start local node
solana-test-validator
# Check & set configs
solana config get
solana config set --url localhost
# generate local wallet if needed
solana-keygen new
solana config set -k ~/.config/solana/id.json
solana airdrop 2
solana balance
```