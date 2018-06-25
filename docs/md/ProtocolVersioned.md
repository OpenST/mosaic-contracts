# OpenST Protocol Documentation

## ProtocolVersioned


Administers protocol versioning

### Function Summary

Signature | Returns | Details
--- | --- | ---
completeProtocolTransfer() | success bool | Only after the waiting period, can proposed protocol complete the transfer; emits ProtocolTransferCompleted event; only callable by proposed protocol
initiateProtocolTransfer<br/>(address) | success bool | Takes _proposedProtocol<br/><br/>Initiates protocol transfer; emits ProtocolTransferInitiated event; only callable by protocol
revokeProtocolTransfer() | success bool | protocol can revoke initiated protocol transfer; emits ProtocolTransferRevoked event; only callable by protocol

