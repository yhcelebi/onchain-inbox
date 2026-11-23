# onchain-inbox

[![test](https://github.com/yhcelebi/onchain-inbox/actions/workflows/test.yml/badge.svg)](https://github.com/yhcelebi/onchain-inbox/actions/workflows/test.yml)

An on-chain message board written in Solidity. Anyone can post a message; the latest one is the current message, and every message is kept on-chain with its author and timestamp.

## Features

- **Message history:** every post is stored as `{ author, timestamp, text }` and can be read by id
- **Events:** `MessagePosted(id, author, text)` lets a frontend or indexer follow the board without polling
- **Validation:** empty messages and messages over 280 bytes are rejected
- **Owner controls:** the deployer can pause and resume posting
- **Custom errors** instead of revert strings, for cheaper and clearer failures
- **Fully tested:** 11 tests, 100% line and branch coverage, run on every push by GitHub Actions

## Contract API

| Function | Description |
|---|---|
| `setMessage(string text)` | Post a new message (reverts when paused, empty or too long) |
| `message() → string` | Text of the latest message |
| `latest() → Message` | Latest message with author and timestamp |
| `getMessage(uint256 id) → Message` | Message by id; `0` is the initial message |
| `messageCount() → uint256` | Number of messages, including the initial one |
| `setPaused(bool)` | Owner only: stop or resume posting |

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm test              # run the test suite
npm run coverage      # coverage report
REPORT_GAS=true npm test   # gas usage per function
npm run deploy:local  # deploy to an in-memory Hardhat network
```

### Deploying to Sepolia

1. Copy `.env.example` to `.env` and fill in `SEPOLIA_RPC_URL` (e.g. from Alchemy or Infura) and the `PRIVATE_KEY` of a test wallet with Sepolia ETH
2. Run `npm run deploy:sepolia`
3. Optionally verify the source: `npx hardhat verify --network sepolia <address> "Hello, chain!"`

Use a throwaway test wallet; `.env` is gitignored.

## Tech

Solidity 0.8.24 · Hardhat · ethers.js v6 · Mocha/Chai · solidity-coverage · GitHub Actions

## License

MIT
