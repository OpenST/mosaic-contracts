# 💠 Mosaic Contracts

![Build master](https://img.shields.io/travis/OpenSTFoundation/mosaic-contracts/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenSTFoundation/mosaic-contracts/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openstfoundation/mosaic-contracts.svg?style=flat)
[![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)][discourse]
[![Chat on Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/SimpleToken.svg?style=flat)][gitter]

Mosaic is a parallelization schema for decentralized applications.
It composes heterogeneous blockchain systems into one another.
Decentralized applications can use Mosaic to compute over a composed network of multiple blockchain systems in parallel.

Mosaic enables building scalable blockchain token economies through the bidirectional transposition of ERC20 tokens on one blockchain, the *origin* chain, and a utility token representation on another blockchain, the *auxiliary* chain.

The protocol defines a set of actions that together perform atomic token transfers across two blockchains using gateway contracts. A gateway for a given EIP20 token is comprised of a `EIP20Gateway` contract on origin, a corresponding `EIP20CoGateway` contract on auxiliary, and and an ERC20 utility token contract on auxiliary that mints and burns utility tokens to atomically mirror tokens staked and unstaked on the origin chain.

Atomicity is achieved using a 2-phase message passing architecture between the chains. Messages are declared on the source chain, and confirmed on the target chain with Patricia Merkle proofs once the source chain is finalized. Once messages are confirmed on the target chain, they can efficiently progressed with a hashlock.
Messages can also be reverted if they are not yet completed on the target chain.

You can read [the draft of the mosaic whitepaper][mosaic whitepaper] or [the original OpenST whitepaper][openst whitepaper].

## Instructions

### For JS Consumers

#### Installation

```bash
npm install @openstfoundation/mosaic-contracts
```

#### Usage

```js
// Load the contracts' meta-data from the package:
const {
  Anchor,
  CoGatewayUtilityTokenInterface,
  EIP20CoGateway,
  EIP20Gateway,
  EIP20Interface,
  EIP20Token,
  GatewayLib,
  MerklePatriciaProof,
  MessageBus,
  Organization,
  OrganizationInterface,
  Organized,
  OSTPrime,
  StateRootInterface,
  UtilityToken,
  UtilityTokenInterface,
} = require('@openstfoundation/mosaic-contracts');

// Access the ABIs and BINs directly on the contracts. For example:
const anchorAbi = Anchor.abi;
const anchorBinary = Anchor.bin;
```

### For Direct Users

This section is only required if you want to *set up a **new** mosaic chain.*

#### Installation

```bash
git clone git@github.com:OpenSTFoundation/mosaic-contracts.git
cd mosaic-contracts
npm install
npm run compile-all
```

#### Usage

There is a deployment tool available for deployment and set-up:
```bash
node ./tools/blue_deployment/index.js
```

> ⚠️ Note that this feature is still very experimental ⚠️

## Related Work

[mosaic.js] uses this package to provide a JavaScript abstraction layer of the mosaic contracts.
You can use [mosaic.js] directly to deploy the contracts and interact with them.

## Contributing

### Set-up

```bash
git clone git@github.com:OpenSTFoundation/mosaic-contracts.git
cd mosaic-contracts
npm install
npm run compile-all
npm run ganache
npm run test

# Requires docker, stop ganache first:
npm run test:integration
```

### Guidelines

There are multiple ways to contribute to this project. However, before contributing, please first review the [Code of Conduct].

We track our [issues] on GitHub.

To contribute code, please ensure that your submissions adhere to the [Style Guide]; please also be aware that this project is under active development and we have not yet established firm contribution guidelines or acceptance criteria.

### Community

* [Forum][discourse]
* [Gitter]

[code of conduct]: https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/CODE_OF_CONDUCT.md
[discourse]: https://discuss.openst.org/
[gitter]: https://gitter.im/OpenSTFoundation/SimpleToken
[issues]: https://github.com/OpenSTFoundation/mosaic-contracts/issues
[mosaic.js]: https://github.com/OpenSTFoundation/mosaic.js
[mosaic whitepaper]: https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/docs/mosaicv0.pdf
[openst whitepaper]: https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view
[style guide]: https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/SOLIDITY_STYLE_GUIDE.md
