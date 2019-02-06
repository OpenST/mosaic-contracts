# 💠 Mosaic Contracts

![Build master](https://img.shields.io/travis/OpenSTFoundation/mosaic-contracts/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenSTFoundation/mosaic-contracts/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openstfoundation/mosaic-contracts.svg?style=flat)
[![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)](https://discuss.openst.org/)
[![Chat on Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/SimpleToken.svg?style=flat)](https://gitter.im/OpenSTFoundation/SimpleToken)

Mosaic is a parallelization schema for decentralized applications.
It composes heterogeneous blockchain systems into one another.
Decentralized applications can use Mosaic to compute over a composed network of multiple blockchain systems in parallel.

Mosaic enables building scalable blockchain token economies through the bidirectional transposition of ERC20 tokens on one blockchain, the *origin* chain, and a utility token representation on another blockchain, the *auxiliary* chain.

The Protocol defines a set of actions that are performed atomically across a gateway. A gateway for a given token is comprised of a `EIP20Gateway` contract on origin, a corresponding `EIP20CoGateway` contract on auxiliary, and and an ERC20 contract on auxiliary that mints and burns utility tokens for an equivalent value of ERC20 tokens staked and unstaked on origin. Atomicity is achieved by combining performance of the transpositional actions in a 2-phase-commit structure with a hash-timelock on each of the origin and auxiliary chains.

You can read [the draft of the mosaic whitepaper](https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/docs/mosaicv0.pdf) or [the original OpenST whitepaper](https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view).

## Installation

```bash
npm install @openstfoundation/mosaic-contracts
```

## Usage

```js
import mosaicContracts from '@openstfoundation/mosaic-contracts';

const { gatewayAbi, gatewayBin } = mosaicContracts.EIP20Gateway;
```

## Related Work

* [mosaic.js](https://github.com/OpenSTFoundation/mosaic.js) uses this package to provide a JavaScript abstraction layer of the mosaic contracts.

## Contributing

### Set-up

```bash
git clone git@github.com:OpenSTFoundation/mosaic-contracts.git
cd mosaic-contracts
npm install
npm run compile-all
npm run test
# Requires docker:
npm run test:integration
```

### Guidelines

There are multiple ways to contribute to this project. However, before contributing, please first review the [Code of Conduct](https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/CODE_OF_CONDUCT.md).

We track our [issues](https://github.com/OpenSTFoundation/mosaic-contracts/issues) on GitHub.

To contribute code, please ensure that your submissions adhere to the [Style Guide](https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/SOLIDITY_STYLE_GUIDE.md); please also be aware that this project is under active development and we have not yet established firm contribution guidelines or acceptance criteria.

### Community

* [Forum](https://discuss.openst.org/)
* [Gitter](https://gitter.im/OpenSTFoundation/SimpleToken)
