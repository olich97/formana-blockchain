# Formana Program

A rust program for [Formana](https://formana.olich.me/) platform.

## Prerequisites

- [Node](https://nodejs.org/en) v22+
- [Rustup](https://rustup.rs/) v1.22+
- [Rust](https://www.rust-lang.org/it) v1.79+
- [Yarn](https://yarnpkg.com/)
- [Solana Developing Programs](https://solana.com/docs/programs/overview)

## Getting Started

```bash
# Build the code
cargo build-bpf
# or
yarn build

# Test the code
yarn test

# Build and test
yarn build-and-test

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

# Deploy
solana program deploy ./target/deploy/formana_program.so
# or
yarn deploy
```