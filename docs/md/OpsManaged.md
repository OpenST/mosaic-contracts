# OpenST Protocol Documentation

## OpsManaged


OpenST ownership and permission model

### Function Summary

Signature | Returns | Details
--- | --- | ---
completeOwnershipTransfer() | success bool | Sets proposedOwner to owner and proposedOwner to 0; only callable by proposedOwner; emits OwnershipTransferCompleted event
initiateOwnershipTransfer<br/>(address) | success bool | Takes _proposedOwner<br/><br/>Sets proposedOwner to _proposedOwner; only callable by owner; emits OwnershipTransferInitiated event
setAdminAddress<br/>(address) | bool | Takes _adminAddress<br/><br/>Sets adminAddress to _adminAddress and returns true; only callable by owner or adminAddress; adminAddress can also be set to 0 to 'disable' it
setOpsAddress<br/>(address) | bool | Takes _opsAddress<br/><br/>Sets opsAddress to _opsAddress and returns true; only callable by owner or adminAddress; _opsAddress can also be set to 0 to 'disable' it

