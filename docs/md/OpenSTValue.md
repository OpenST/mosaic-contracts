# OpenST Protocol Documentation

## OpenSTValue


value staking contract for OpenST 

### Function Summary

Signature | Returns | Details
--- | --- | ---
addCore<br/>(address) | success bool | Takes _core<br/><br/>Adds _core to cores by core.chainIdRemote; only callable by registrar
blocksToWaitLong() | uint256 | Returns BLOCKS_TO_WAIT_LONG
blocksToWaitShort() | uint256 | Returns BLOCKS_TO_WAIT_SHORT
completeOwnershipTransfer() | success bool | Sets proposedOwner to owner and proposedOwner to 0; only callable by proposedOwner; emits OwnershipTransferCompleted event
confirmRedemptionIntent<br/>(bytes32, address, uint256, uint256, uint256, bytes32) | amountST, expirationHeight | Takes _uuid, _redeemer, _redeemerNonce, _amountUT, _redemptionUnlockHeight, _redemptionIntentHash<br/><br/>Confirms redemption intent; emits RedemptionIntentConfirmed event; only callable by registrar
core<br/>(uint256) | address | Takes _chainIdUtility<br/><br/>Returns core address
getNextNonce<br/>(address) | uint256 | Takes _account<br/><br/>Returns next nonce
hashRedemptionIntent<br/>(bytes32, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _amountUT, _escrowUnlockHeight
hashStakingIntent<br/>(bytes32, address, uint256, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _beneficiary, _amountST, _amountUT, _escrowUnlockHeight
hashUuid<br/>(string, string, uint256, uint256, address, uint256) | bytes32 | Returns hash of _symbol, _name, _chainIdValue, _chainIdUtility, _openSTUtility, _conversionRate
initiateOwnershipTransfer<br/>(address) | success bool | Takes _proposedOwner<br/><br/>Sets proposedOwner to _proposedOwner; only callable by owner; emits OwnershipTransferInitiated event
initiateProtocolTransfer<br/>(address, address) | success bool | Takes _simpleStake, _proposedProtocol<br/><br/>Initiates transfer to _proposedProtocol for _simpleStake; only callable by adminAddress
processStaking<br/>(bytes32) | stakeAddress | Takes _stakingIntentHash<br/><br/>Processes corresponding stake; emits ProcessedStake event
processUnstaking<br/>(bytes32) | stakeAddress | Takes _redemptionIntentHash<br/><br/>Processes corresponding unstake; emits ProcessedUnstake event
registerUtilityToken<br/>(string, string, uint256, uint256, address, bytes32) | uuid | Takes _symbol, _name, _conversionRate, _chainIdUtility, _stakingAccount, _checkUuid<br/><br/>Registers a utility token; emits UtilityTokenRegistered event; only callable by registrar
revertStaking<br/>(bytes32) | uuid, staker, amountST, staker | Takes _stakingIntentHash<br/><br/>Reverts corresponding stake; emits RevertedStake event
revertUnstaking<br/>(bytes32) | uuid, redeemer, amountST | Takes _redemptionIntentHash<br/><br/>Reverts corresponding unstake; emits RevertedUnstake event
revokeProtocolTransfer<br/>(address) | success bool | Takes _simpleStake<br/><br/>Revokes protocol transfer; on the very first released version v0.9.1 there is no need to completeProtocolTransfer from a previous version; only callable by adminAddress
setAdminAddress<br/>(address) | bool | Takes _adminAddress<br/><br/>Sets adminAddress to _adminAddress and returns true; only callable by owner or adminAddress; adminAddress can also be set to 0 to 'disable' it
setOpsAddress<br/>(address) | bool | Takes _opsAddress<br/><br/>Sets opsAddress to _opsAddress and returns true; only callable by owner or adminAddress; _opsAddress can also be set to 0 to 'disable' it
stake<br/>(bytes32, uint256, address) | amountUT, nonce, unlockHeight, stakingIntentHash | Takes _uuid, _amountST, _beneficiary<br/><br/>In order to stake the tx.origin needs to set an allowance for the OpenSTValue contract to transfer to itself to hold during the staking process.
utilityTokenProperties<br/>(bytes32) | symbol, name, conversionRate, decimals, chainIdUtility, simpleStake, stakingAccount | 

