# OpenST Protocol Documentation

## SimpleStake


Stakes the value of an EIP20 token on Ethereum for a utility token on the OpenST platform

### Function Summary

Signature | Returns | Details
--- | --- | ---
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
getTotalStake() | uint256 | total stake is the balance of the staking contract; accidental transfers directly to SimpleStake bypassing the OpenST protocol will not mint new utility tokens, but will add to the total stake; (accidental) donations can not be prevented
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
releaseTo<br/>(address, uint256) | success bool | Takes _to, _amount<br/><br/>Allows the protocol to release the staked amount into provided address. The protocol MUST be a contract that sets the rules on how the stake can be released and to who. The protocol takes the role of an "owner" of the stake. Only callable by protocol. Emits ReleasedStake event.
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol

