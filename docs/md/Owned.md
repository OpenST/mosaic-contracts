# OpenST Protocol Documentation

## Owned


Implements basic ownership with 2-step transfers

### Function Summary

Signature | Returns | Details
--- | --- | ---
completeOwnershipTransfer() | success bool | Sets proposedOwner to owner and proposedOwner to 0; only callable by proposedOwner; emits OwnershipTransferCompleted event
initiateOwnershipTransfer<br/>(address) | success bool | Takes _proposedOwner<br/><br/>Sets proposedOwner to _proposedOwner; only callable by owner; emits OwnershipTransferInitiated event

