# [OpenST protocol](https://simpletoken.org) - staking value for utility

**warning: this is pre-alpha software and under heavy development**

## About Simple Token

Simple Token [“ST”] is an EIP20 token and OpenST is a protocol to support token economies in mainstream consumer applications. The business and technical challenge we set out to solve is to enable mainstream consumer applications to benefit from deploying their own branded crypto-backed token economies, in a scalable and cryptographically auditable manner, without needing to mint and maintain their own publicly-tradeable EIP20 tokens.

The OpenST protocol enables the creation of utility tokens on a utility blockchain while the value of those tokens is backed by staked crypto-assets on a value blockchain.

The OpenST Protocol establishes a bridge between two differently purposed blockchains.  A value blockchain, which is required in order to hold cryptographically secured valuable assets; and a utility blockchain, which has utility tokens in favor of which the assets are held on the value blockchain.

## OpenST Protocol

To mint utility tokens on a utility chain out of value staked on a value chain, or to redeem value on the value chain by redeeming ownership of utility tokens on the utility chain, the protocol needs to atomically act on two blockchains.  OpenST Protocol requires a two-phased commit for either action.

`openst-protocol` provides the smart contracts that implement the OpenST protocol which enables staking and redeeming utility tokens. For more details see the technical white paper on [simpletoken.org/documents](https://simpletoken.org/documents).

![](docs/protocol.png)

## Roadmap

Milestone 1 : Minimal Viable Utility (7 November 2017)

Milestone 2 : External Proof & Security Audits (Q1 2018)

Milestone 3 : Public Launch of Initial Member Companies (Q2 2018)

Milestone 4 : 10 Founding Member Companies (Q3-Q4 2018)

Milestone 5 : Consolidation of OpenST as open platform (2019)

At the highest level this diagram represents past work and future roadmap items.  All milestones and work items are indicative only.

![](docs/roadmap.png)
