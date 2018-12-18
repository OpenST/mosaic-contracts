## Deployment tool

There is a JS library under `tools/deployment_tool`, which helps in building deployment scripts for non-traditional scenarios.

### Features

- Can output the `accounts` section for a [Parity chainspec][parity-chainspec] to allow
for deployments during Genesis block creation
- Can output transaction objects for use with [`web3.eth.sendTransaction`][web3-sendtransaction]
- Allows for specifying linked dependencies (Solidity libraries) and
contract address dependencies provided via constructor arguments
- Will automatically order the dependencies correctly

### Usage

```js
const { Contract, ContractRegistry } = require('../deployment_tool'); // Make sure to adjust path

const rootDir = '../../'; // path pointing to the root of the NPM project
// Load and link contracts
const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
const GatewayLib = Contract.loadTruffleContract('GatewayLib', null, { rootDir });
GatewayLib.addLinkedDependency(MerklePatriciaProof);
// Add to registry
const registry = new ContractRegistry();
registry.addContracts([
    GatewayLib,
    MerklePatriciaProof,
]);

// EITHER print out Parity chainspec accounts section:
const accounts = registry.toParityGenesisAccounts();
console.log(JSON.stringify(accounts, null, 4)); // pretty print as JSON
// OR generate web3 transaction objects
const deployerAddress = '0x8fbbbaceff30d4eea3e2ffa2dfedc3c053f78c1f53103e4ddc31309e6b1d5eb3';
const startingNonce = 0; // Can be retrieved from network via `web3.eth.getTransactionCount`
const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
```

## `merge_chainspec_accounts.js` script

A script that allows for merging the output created by
`ContractRegistry#toParityGenesisAccounts` into a existing [Parity chainspec][parity-chainspec]
It will warn if it replaces addresses that were already present in the chainspec.

The resulting chainspec is printed out via STDOUT.

### Usage

Given a chainspec located at `./chainspec.json` and a accounts section at `./accounts.json`, execute in a terminal from the root of the project:

```bash
node tools/merge_chainspec_accounts.js ./chainspec.json ./accounts > merged_chainspec.json
```

## Deploying Anchor-based EIP20 Gateway

The repo contains a tool to deploy an Anchor-based EIP20Gateway<->EIP20CoGateway setup.

### Requirements

- Address of EIP20 token on Origin the gateway should be deployed for (optional for development)
- Address of EIP20 base token on Origin, which is used for bounty (optional for development)
- An RPC node for the Origin chain
  - Needs to have an unlocked account with sufficient tokens and base tokens for deployment
- An RPC node for the Auxiliary chain
  - Needs to have an unlocked account with sufficient tokens and base tokens for deployment

### Commands

To run a local testnet setup via `ganache-cli` run in two seperate terminals:

- `ganache-cli --gasLimit=0x7A1200`
- `ganache-cli --gasLimit=0x7A1200 --port 8546`

To deploy the gateway run:

- `npm install`
- `npm deploy:gateway` will start the interactive deployment process

[parity-chainspec]: https://wiki.parity.io/Chain-specification
[web3-sendtransaction]: https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction
