# Formana Program

A rust program for [Formana](https://formana.olich.me/) platform.

## Getting Started

```bash
# 0. Build the code
cargo build-bpf

# 1. Start local node
solana-test-validator

# 2. Check & set configs (optional)
solana config get
solana config set --url localhost
# generate local wallet if needed
solana-keygen new
solana config set -k ~/.config/solana/id.json
solana airdrop 2
solana balance

# 3. Deploy
solana program deploy ./target/deploy/formana_program.so

```