<h1 align="center">OpenST - Empowering Decentralized Economies</h1>

[![Gitter: JOIN CHAT](https://img.shields.io/badge/gitter-JOIN%20CHAT-brightgreen.svg)](https://gitter.im/OpenSTFoundation/SimpleToken)

[OpenST](https://openst.org/) blockchain infrastructure empowers decentralized economies. The central component of this infrastructure is the OpenST Protocol, a framework for building scalable blockchain token economies.

_While OpenST is available as-is for anyone to use, we caution that this is early stage software and under heavy ongoing development and improvement. Please report bugs and suggested improvements._

## OpenST Protocol
The OpenST Protocol enables building scalable blockchain token economies through the bidirectional transposition of value tokens on one blockchain, the "value chain", and a utility token representation on another blockchain, the "utility chain".

In order to transpose value for utility, the Protocol defines a set of actions that are performed atomically across a gateway. A gateway for a given token is comprised of a gateway contract on the value chain, a corresponding co-gateway contract on a utility chain, and and an ERC20 contract on the utility chain that mints and burns utility tokens for an equivalent value of ERC20 tokens staked and unstaked on the value chain. Atomicity is achieved by combining performance of the transpositional actions in a 2-phase-commit structure with a hash-timelock on each of the value and utility chains.

In addition to the gateway, the Protocol incorporates the concept of a `facilitator`. The facilitator relieves the end-user from the requirement to be online and act on multiple blockchains by staking a `bounty` in order to act on behalf of the user. This bounty is an economic incentive that ensures compliance with the Protocol.

For more information on the fundamentals and mission of the Protocol, please consult the [whitepaper](https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view).

## Related Work
Significant implementations of and projects related to the OpenST Protocol are:

- [openst-platform](https://github.com/OpenSTFoundation/openst-platform): middleware and an API for applications to integrate the OpenST protocol
- [openst-payments](https://github.com/OpenSTFoundation/openst-payments): smart contracts and JS modules for managing and interacting with a token economy

## Contributing
There are multiple ways to contribute to this project. However, before contributing, please first review the [Code of Conduct](https://github.com/OpenSTFoundation/openst-protocol/blob/develop/CODE_OF_CONDUCT.md).

To participate in the discussion on technical matters, please join the project's [Gitter](https://gitter.im/OpenSTFoundation/SimpleToken) channel or review the project's [issues](https://github.com/OpenSTFoundation/openst-protocol/issues).

To contribute code, please ensure that your submissions adhere to the [Style Guide](https://github.com/OpenSTFoundation/openst-protocol/blob/develop/SOLIDITY_STYLE_GUIDE.md); please also be aware, this project is under active development and we have not yet established firm contribution guidelines or acceptance criteria.