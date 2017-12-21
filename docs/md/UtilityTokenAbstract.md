# OpenST Protocol Documentation

## UtilityTokenAbstract


Base utility token functionality for BrandedTokens and STPrime

### Function Summary

Signature | Returns | Details
--- | --- | ---
burn<br/>(address, uint256) | success | Takes _burner, _amount<br/><br/>Burns utility tokens after having redeemed them through the protocol for the staked Simple Token
claim<br/>(address) | success | Takes _beneficiary<br/><br/>Transfers full claim to beneficiary
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
mint<br/>(address, uint256) | success | Takes _beneficiary, _amount<br/><br/>Mints new utility tokens
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol
totalSupply() | uint256 | Get totalTokenSupply as view so that child cannot edit
unclaimed<br/>(address) | uint256 | Takes _beneficiary<br/><br/>Returns unclaimed amount for _beneficiary
uuid() | bytes32 | Returns uuid

