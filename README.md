# 💠 Mosaic Contracts

![Build master](https://img.shields.io/travis/OpenST/mosaic-contracts/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenST/mosaic-contracts/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openst/mosaic-contracts.svg?style=flat)
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
npm install @openst/mosaic-contracts
```

#### Usage

```typescript
// Load the contracts' meta-data from the package:
import { contracts } from "@openst/mosaic-contracts";

// Access the ABIs and BINs directly on the contracts. For example:
const anchorAbi = contracts.Anchor.abi;
const anchorBinary = contracts.Anchor.bin;
```

`@openst/mosaic-contracts` also includes the contract interacts.

Example of using the contract interacts. 
```typescript
import { Interacts} from "@openst/mosaic-contracts";

const anchor:Anchor = Interacts.getAnchor(web3, '0xAnchorContractAddress');
const gateway:EIP20Gateway = Interacts.getEIP20Gateway(web3, '0xEIP20GatewayContactAddress');
```
Example with Web3 contracts.
```typescript
import { contracts } from "@openst/mosaic-contracts";

const jsonInterface = contracts.Anchor.abi;
const contract = new web3.eth.Contract(jsonInterface, address, options);

const anchor:Anchor = contract as Anchor;

```
### For Direct Users

This section is only required if you want to *set up a **new** mosaic chain.*

#### Installation

```bash
git clone https://github.com/OpenST/mosaic-contracts.git
cd mosaic-contracts
npm run update # Runs `git submodule update --init --recursive && npm ci`
npm run compile:all
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
git clone https://github.com/OpenST/mosaic-contracts.git
cd mosaic-contracts
npm run update # Runs `git submodule update --init --recursive && npm ci`
npm run compile:all
npm run ganache
npm run test
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
[issues]: https://github.com/OpenST/mosaic-contracts/issues
[mosaic.js]: https://github.com/OpenST/mosaic.js
[mosaic whitepaper]: https://github.com/OpenST/mosaic-contracts/blob/develop/docs/mosaicv0.pdf
[openst whitepaper]: https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view
[style guide]: https://github.com/OpenST/mosaic-contracts/blob/develop/SOLIDITY_STYLE_GUIDE.md
