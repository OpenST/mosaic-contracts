# OpenST Protocol Documentation

## STPrime


A freely tradable equivalent representation of Simple Token [ST] on Ethereum mainnet on the utility chain; STPrime functions as the base token to pay for gas consumption on the utility chain; it is not an EIP20 token, but functions as the genesis guardian of the finite amount of base tokens on the utility chain

### Function Summary

Signature | Returns | Details
--- | --- | ---
burn<br/>(address, uint256) | bool | Takes _burner, _amount<br/><br/>Burns utility tokens after having redeemed them through the protocol for the staked Simple Token; only callable by protocol
claim<br/>(address) | success bool | Takes _beneficiary<br/><br/>Transfers full claim to beneficiary; claim can be called publicly as the beneficiary and amount are set, and this allows for reduced steps on the user experience to complete the claim automatically; for first stake of ST' the gas price by one validator has to be zero to deploy the contracts and accept the very first staking of ST for ST' and its protocol executions.
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
initialize() |  | On setup of the utility chain the base tokens need to be transfered in full to STPrime for the base tokens to be minted as ST'
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
mint<br/>(address, uint256) |  | Takes _beneficiary, _amount<br/><br/>Mints new Simple Token Prime into circulation and increase total supply accordingly; tokens are minted into a claim to ensure that the protocol completion does not continue into foreign contracts at _beneficiary; only callable by protocol
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol
totalSupply() | uint256 | Get totalTokenSupply as view so that child cannot edit
unclaimed<br/>(address) | uint256 | Takes _beneficiary<br/><br/>Returns unclaimed amount for _beneficiary
uuid() | bytes32 | Returns uuid

