# OpenST Protocol Documentation

## UtilityTokenAbstractMock


Implements mock claim, mint, and burn functions and wraps internal functions to enable testing UtilityTokenAbstract

### Function Summary

Signature | Returns | Details
--- | --- | ---
burn<br/>(address, uint256) | success bool | Mock burn function
burnInternalPublic<br/>(address, uint256) | success bool | Public wrapper for burnInternal
claim<br/>(address) | success bool | Mock claim function
claimInternalPublic<br/>(address) | amount | Public wrapper for claimInternal
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
mint<br/>(address, uint256) | success bool | Mock mint function
mintInternalPublic<br/>(address, uint256) | success bool | Public wrapper for mintInternal
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol
totalSupply() | uint256 | Get totalTokenSupply as view so that child cannot edit
unclaimed<br/>(address) | uint256 | Takes _beneficiary<br/><br/>Returns unclaimed amount for _beneficiary
uuid() | bytes32 | Returns uuid

