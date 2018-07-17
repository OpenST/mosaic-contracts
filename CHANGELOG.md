## OpenST-protocol [v0.9.3](https://github.com/OpenSTFoundation/openst-protocol/releases/tag/v0.9.3) July 18 2018

The OpenST protocol is a framework for building token economies.  To scale Ethereum's throughput capacity, OpenST includes the OpenST-Gateway protocol and OpenST-Mosaic protocol.  OpenST-Gateway is a layer-2 sharding schema for (non-fungible) tokens. A gateway can be used to transpose ownership of tokens from Ethereum to different auxiliary blockchains and back.  These auxiliary blockchains are secured by OpenST-Mosaic on Ethereum, and the transactions executed on them are finalised on Ethereum.  As all value is defined on Ethereum before it is moved over a gateway to the auxiliary blockchains, OpenST is a layer-2 scaling solution to Ethereum.

OpenST v0.9.3 is a milestone release as we complete the first two types of a gateway and improve the usability of the OpenST protocol.
A gateway is a triplet of a gateway contract on the value chain, a corresponding co-gateway contract on a utility chain and a transformation function t that acts on tokens types defined on the value chain to transformed tokens on the utility chain.

The first type of gateway defines Branded Tokens on a utility chain with their value backed with ERC20 tokens on Ethereum mainnet.  For a branded token, on definition, the gateway allows a precision mapping between the precision of the value token onto the precision the branded token, which is expressed in the conversion rate.

The second type of gateway awards base tokens on the utility chain at a 1:1 ratio for OST staked on the value chain, making the base token of the utility chain equivalent to OST.  Each utility chain has only one such gateway, and transactions on the utility chain are therefore effectively paid in OST.  Transaction fee rewards earned by the validators on the utility chain are earned in OST, as they can unstake the equivalent amount by redeeming the base token of the utility chain.

The OpenST-Gateway protocol atomically transposes the ownership of tokens between chains.  With the release of v0.9.3 OpenST is fully decentralised and any actor move ownership across the gateway, if she can prove ownership and declared intent.  The process is a two-phased, hash-timelock which requires the user to be online during the process.  To make it easier for end-users the current release introduces the concept of the facilitator, which can be any agent who is capable to do the actions on behalf of the user.  The smart contracts bind the actions of the facilitator so the user does not need to trust the facilitator; the facilitator is at risk of losing a staked bounty if he would fail to follow the process correctly.

In next version the facilitator role will be opened up to earn a fee in OST, and a gateway-fee market will be introduced to accept requests from users who want to traverse tokens across a gateway.

With this release the gateway relies only on Merkle proofs of the remote blockchain to prove user intentions, and as such we completed the "interblockchain communication", where there is no need to rely on trusted parties to transfer information between blockchains.

Detailed changelog:

- Documentation: update sequence diagram for v0.9.3 ([openst-protocol #161](https://github.com/OpenSTFoundation/openst-protocol/pull/161))
- Tests: check relevant external RLP library functionality ([openst-protocol #185](https://github.com/OpenSTFoundation/openst-protocol/pull/185))
- Contracts: update contracts to reflect different speeds at which blocks are added to value and utility chains ([openst-protocol #153](https://github.com/OpenSTFoundation/openst-protocol/pull/153))
- Contracts: improve documentation comments across contracts ([openst-protocol #191](https://github.com/OpenSTFoundation/openst-protocol/pull/191), [openst-protocol #193](https://github.com/OpenSTFoundation/openst-protocol/pull/193))
- Contracts: incorporate storage proof of `stakingIntentHash` into `OpenSTUtility` ([openst-protocol #200](https://github.com/OpenSTFoundation/openst-protocol/pull/200))
- Tests: check relevant external Merkle Patricia Proof library functionality ([openst-protocol #173](https://github.com/OpenSTFoundation/openst-protocol/pull/173))
- Tests: assay account and storage proof functionality in `Core` ([openst-protocol #179](https://github.com/OpenSTFoundation/openst-protocol/pull/179))
- Contracts: introduce Merkle Patricia Proof verification into redeem and unstake flow ([openst-protocol #163](https://github.com/OpenSTFoundation/openst-protocol/pull/163))
- Tools: update package.json dependencies ([openst-protocol #194](https://github.com/OpenSTFoundation/openst-protocol/pull/194))
- Contracts: enforce stakingAccount on `processStaking` and `revertStaking` in `OpenSTValue` ([openst-protocol #195](https://github.com/OpenSTFoundation/openst-protocol/pull/195))
- Tools: upgrade to Solidity 0.4.23 ([openst-protocol #189](https://github.com/OpenSTFoundation/openst-protocol/pull/189))
- Contracts: enable resetting `workers` for `Gateway` ([openst-protocol #187](https://github.com/OpenSTFoundation/openst-protocol/pull/187))
- Tests: confirm determination of `intents` mapping index position for `OpenSTValue` ([openst-protocol #172](https://github.com/OpenSTFoundation/openst-protocol/pull/172))
- Contracts: Rename `Gate` to `Gateway` ([openst-protocol #182](https://github.com/OpenSTFoundation/openst-protocol/pull/182))
- Contracts: remove requirement that only workers can call `revertStaking` in `Gate` ([openst-protocol #180](https://github.com/OpenSTFoundation/openst-protocol/pull/180))
- Contracts: delete correct stake request in `rejectStakeRequest` ([openst-protocol #177](https://github.com/OpenSTFoundation/openst-protocol/pull/177))
- Contracts: add documentation comments to `Gate` ([openst-protocol #160](https://github.com/OpenSTFoundation/openst-protocol/pull/160))
- Contracts: remove requirement that only workers can call `processStaking` in `Gate` ([openst-protocol #169](https://github.com/OpenSTFoundation/openst-protocol/pull/169))
- Contracts: refactor proof verification events in `Core` ([openst-protocol #167](https://github.com/OpenSTFoundation/openst-protocol/pull/167))
- Contracts: correct variable name in `processStaking` for `Gate` ([openst-protocol #171](https://github.com/OpenSTFoundation/openst-protocol/pull/171))
- Contracts: incorporate mapping of staking intent hashes into `OpenSTValue` to for storage verification ([openst-protocol #150](https://github.com/OpenSTFoundation/openst-protocol/pull/150))
- Tools: replace TestRPC with Ganache ([openst-protocol #156](https://github.com/OpenSTFoundation/openst-protocol/pull/156))
- Contracts: add state root storing and account proof verification functionality to `Core` ([openst-protocol #149](https://github.com/OpenSTFoundation/openst-protocol/pull/149))
- Tests: fix `Gate` tests ([openst-protocol #159](https://github.com/OpenSTFoundation/openst-protocol/pull/159))
- Contracts: revise returns for certain `Gate` functions ([openst-protocol #147](https://github.com/OpenSTFoundation/openst-protocol/pull/147))
- Tools: reorganize proof contracts and libraries within repository ([openst-protocol #158](https://github.com/OpenSTFoundation/openst-protocol/pull/158))
- Tests: flag changes that problematize proving certain contracts' storage ([openst-protocol #155](https://github.com/OpenSTFoundation/openst-protocol/pull/155))
- Contracts: update external RLP library to be in line with current Solidity usage ([openst-protocol #154](https://github.com/OpenSTFoundation/openst-protocol/pull/154))
- Contracts: incorporate proof verification libraries and revise layout of storage for certain contracts ([openst-protocol #148](https://github.com/OpenSTFoundation/openst-protocol/pull/148))
- Contracts: add documentation comments to `Workers` ([openst-protocol #137](https://github.com/OpenSTFoundation/openst-protocol/pull/137))
- Contracts: incorporate `Gate` proof of concept ([openst-protocol #141](https://github.com/OpenSTFoundation/openst-protocol/pull/141))
- Documentation: present initial sequence diagram for v0.9.3 ([openst-protocol #133](https://github.com/OpenSTFoundation/openst-protocol/pull/133))
- Contracts: update contracts to remove compiler warnings ([openst-protocol #132](https://github.com/OpenSTFoundation/openst-protocol/pull/132))
- Tools: upgrade web3 version to v1.0.0.beta.33 ([openst-protocol #131](https://github.com/OpenSTFoundation/openst-protocol/pull/131))
- Contracts: incorporate hashlock ([openst-protocol #126](https://github.com/OpenSTFoundation/openst-protocol/pull/126))
- Tests: refactor tests for `MockToken` ([openst-protocol #121](https://github.com/OpenSTFoundation/openst-protocol/pull/121))

## OpenST-protocol [v0.9.2](https://github.com/OpenSTFoundation/openst-protocol/releases/tag/v0.9.2) March 27 2018

OpenST v0.9.2 improves usability to facilitate application by the [OpenST-Platform](https://github.com/OpenSTFoundation/openst-platform) and other services. Additionally, this release increases test coverage, with additional unit and integration tests, and adds continuous integration with Travis CI.

Detailed changelog:

- Introduce `conversionRateDecimals` to `BrandedToken` to treat conversion rate as a fixed point arithmetic number ([openst-protocol #107](https://github.com/OpenSTFoundation/openst-protocol/pull/107))
- Expose list of registered tokens on `OpenSTUtility` ([openst-protocol #89](https://github.com/OpenSTFoundation/openst-protocol/pull/89))
- Make token UUIDs iterable on the value chain ([openst-protocol #103](https://github.com/OpenSTFoundation/openst-protocol/pull/103))
- Make token UUIDs iterable on the utility chain ([openst-protocol #102](https://github.com/OpenSTFoundation/openst-protocol/pull/102))
- Incorporate a `beneficiary` into redeem and unstake ([openst-protocol #101](https://github.com/OpenSTFoundation/openst-protocol/pull/101))
- Expose `mints` and `redemptions` on `OpenSTUtility` ([openst-protocol #100](https://github.com/OpenSTFoundation/openst-protocol/pull/100))
- Expose `stakes` and `unstakes` on `OpenSTValue` ([openst-protocol #99](https://github.com/OpenSTFoundation/openst-protocol/pull/99))
- Revise `UtilityTokenAbstract` to set certain invariants upon construction and to expose them ([openst-protocol #97](https://github.com/OpenSTFoundation/openst-protocol/pull/97)) 
- Remove unneeded files ([openst-protocol #93](https://github.com/OpenSTFoundation/openst-protocol/pull/93))
- Tests: configure Travis CI to run unit tests on `master` and `develop` branches for every commit, merge and pull request ([openst-protocol #87](https://github.com/OpenSTFoundation/openst-protocol/pull/87), [openst-protocol #105](https://github.com/OpenSTFoundation/openst-protocol/pull/105))
- Tests: denominate tokens consistently ([openst-protocol #82](https://github.com/OpenSTFoundation/openst-protocol/pull/82))
- Tests: add unit tests for reversion functions ([openst-protocol #74](https://github.com/OpenSTFoundation/openst-protocol/pull/74))
- Tests: migrate unit tests for `Owned`, `OpsManaged`, and `SafeMath` from SimpleTokenSale repo ([openst-protocol #73](https://github.com/OpenSTFoundation/openst-protocol/pull/73))
- Tests: add integration tests for reversion functions ([openst-protocol #65](https://github.com/OpenSTFoundation/openst-protocol/pull/65))

## OpenST-protocol [v0.9.1](https://github.com/OpenSTFoundation/openst-protocol/releases/tag/v0.9.1) December 19 2017

OpenST v0.9.1 is the first release deployed on Ethereum mainnet combined with the
activation of Simple Token to power the OpenST platform.  The OpenST platform
allows Ethereum smart contracts to runs faster and cheaper while leveraging
the security properties of Ethereum's Proof-of-Work.  In this release we implement
the first corner stone of the protocol: the ability to stake value on Ethereum
mainnet and mint a new representation of that value on a utility chain,
effectively increasing the computational throughput of Ethereum smart contracts
by allowing parallel execution across chains.

OpenST smart contracts have been restructured to store value separately from
the logic that implements the protocol.  v0.9.1 is not yet protocol complete
as the validators are whitelisted and not yet open with stake put forward on
Ethereum mainnet.  However, by splitting the protocol implementation into
these two logically separate problems, we can already start working with
member companies and developers to fine-tune the APIs and the developer
experience to build mainstream applications on Ethereum.

```
  Ethereum mainnet (value)   |  OpenST platform (utility)
  ---------------------------------------------------------------------
      Core - - - - - - - - - - - (Core)
      /                      |      \
     /                       |       \
  Registrar                  |  Registrar
    |                        |        |
  OpenSTValue                |  OpenSTUtility
    \_ SimpleStake           |    \_ UtilityTokenAbstract
                             |         \_ SimpleTokenPrime (base token)
                             |         \_ BrandedToken
```

Detailed changelog:

- Generate documentation in /docs ([openst-protocol#78](https://github.com/OpenSTFoundation/openst-protocol/pull/78))
- Unit tests for Owned, OpsManaged, SafeMath (carry over from SimpleTokenSale) ([openst-protocol#73](https://github.com/OpenSTFoundation/openst-protocol/pull/73))
- Add mock ERC20 token for dryrun on Ethereum mainnet ([openst-protocol#71](https://github.com/OpenSTFoundation/openst-protocol/pull/71))
- Unit tests for protocol transfer ([openst-protocol#66](https://github.com/OpenSTFoundation/openst-protocol/pull/66))
- Integration tests for reverting stake and redemption ([openst-protocol#65](https://github.com/OpenSTFoundation/openst-protocol/pull/65))
- Bug fix revert unstaking was restricted to registrar only ([openst-protocol#64](https://github.com/OpenSTFoundation/openst-protocol/pull/64))
- Implement fallback for process staking and process redemption ([openst-protocol#60](https://github.com/OpenSTFoundation/openst-protocol/pull/60))
- Bug fix on reverted redemption allow re-use of nonce ([openst-protocol#59](https://github.com/OpenSTFoundation/openst-protocol/pull/59))
- Initiate and revoke protocol transfer ([openst-protocol#55](https://github.com/OpenSTFoundation/openst-protocol/pull/55))
- Run Truffle tests with optimised compilation to accurately measure gas usage ([openst-protocol#54](https://github.com/OpenSTFoundation/openst-protocol/pull/54))
- Integration tests improvement on event assertion ([openst-protocol#47](https://github.com/OpenSTFoundation/openst-protocol/pull/47))
- Allow reverting escrow after unlock height ([openst-protocol#46](https://github.com/OpenSTFoundation/openst-protocol/pull/46))
- Set minimal redemption accuracy ([openst-protocol#41](https://github.com/OpenSTFoundation/openst-protocol/pull/41)),  ([openst-protocol#38](https://github.com/OpenSTFoundation/openst-protocol/pull/38))
- Integration test framework for staking ([openst-protocol#37](https://github.com/OpenSTFoundation/openst-protocol/pull/37))
- Increase unit test coverage for Registrar, OpenSTValue, and OpenSTUtility ([openst-protocol#35](https://github.com/OpenSTFoundation/openst-protocol/pull/35))
- Bug fix in OpenSTUtility.processRedeeming ([openst-protocol#33](https://github.com/OpenSTFoundation/openst-protocol/pull/33))
- Correct assertion bug on OpenSTValue.processStaking ([openst-protocol#18](https://github.com/OpenSTFoundation/openst-protocol/pull/18))
- Complete separation of value and logic for redemption process ([openst-protocol#11](https://github.com/OpenSTFoundation/openst-protocol/pull/11)), ([openst-protocol#12](https://github.com/OpenSTFoundation/openst-protocol/pull/12)),  ([openst-protocol#13](https://github.com/OpenSTFoundation/openst-protocol/pull/13))
- Unit tests for ProtocolVersioned, SimpleStake, BrandedToken, EIP20Token, STPrime, and UtilityTokenAbstract ([openst-protocol#9](https://github.com/OpenSTFoundation/openst-protocol/pull/9))
- SimpleTokenPrime: add payable initialization function ([openst-protocol#7](https://github.com/OpenSTFoundation/openst-protocol/pull/7))
- SimpleStake: separate value from logic to enable upgrade path ([openst-protocol#5](https://github.com/OpenSTFoundation/openst-protocol/pull/1))


## OpenST-protocol [v0.9.0](https://github.com/OpenSTFoundation/openst-protocol/releases/tag/v0.9.0) November 8 2017

 - update OpenST-protocol with work done on Ropsten demo ([openst-protocol#1](https://github.com/OpenSTFoundation/openst-protocol/pull/1))
