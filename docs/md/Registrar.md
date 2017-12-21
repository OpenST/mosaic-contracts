# OpenST Protocol Documentation

## Registrar


Administers registrations for utility tokens

### Function Summary

Signature | Returns | Details
--- | --- | ---
addCore<br/>(address, address) | success bool | Takes _registry, _core<br/><br/>Adds _core to _registry; only callable by adminAddress or opsAddress
completeOwnershipTransfer() | success bool | Sets proposedOwner to owner and proposedOwner to 0; only callable by proposedOwner; emits OwnershipTransferCompleted event
confirmRedemptionIntent<br/>(address, bytes32, address, uint256, uint256, uint256, bytes32) | amountST, expirationHeight | Takes __registry, uuid, _redeemer, _redeemerNonce, _amountUT, _redemptionUnlockHeight, _redemptionIntentHash<br/><br/>Confirms redemption intent with _registry; only callable by opsAddress
confirmStakingIntent<br/>(address, bytes32, address, uint256, address, uint256, uint256, uint256, bytes32) | expirationHeight | Takes _registry, _uuid, _staker, _stakerNonce, _beneficiary, _amountST, _amountUT, _stakingUnlockHeight, _stakingIntentHash<br/><br/>Confirms staking intent with _registry; only callable by opsAddress
initiateOwnershipTransfer<br/>(address) | success bool | Takes _proposedOwner<br/><br/>Sets proposedOwner to _proposedOwner; only callable by owner; emits OwnershipTransferInitiated event
processRedeeming<br/>(address, bytes32) | tokenAddress | Takes _registry, _redemptionIntentHash<br/><br/>Processes corresponding redemption with _registry; only callable by adminAddress
processStaking<br/>(address, bytes32) | stakeAddress | Takes _registry, _stakingIntentHash<br/><br/>Processes stake with _registry; only callable by adminAddress
registerBrandedToken<br/>(address, string, string, uint256, address, address, bytes32) | registeredUuid | Takes _registry, _symbol, _name, _conversionRate, _requester, _brandedToken, _checkUuid<br/><br/>Registers a branded token with _registry; only callable by adminAddress or opsAddress
registerUtilityToken<br/>(address, string, string, uint256, uint256, address, bytes32) | uuid | Takes _registry, _symbol, _name, _conversionRate, _chainIdUtility, _stakingAccount, _checkUuid<br/><br/>Registers a utility token with _registry; only callable by adminAddress or opsAddress
setAdminAddress<br/>(address) | bool | Takes _adminAddress<br/><br/>Sets adminAddress to _adminAddress and returns true; only callable by owner or adminAddress; adminAddress can also be set to 0 to 'disable' it
setOpsAddress<br/>(address) | bool | Takes _opsAddress<br/><br/>Sets opsAddress to _opsAddress and returns true; only callable by owner or adminAddress; _opsAddress can also be set to 0 to 'disable' it

