# OpenST Protocol Documentation

## OpenSTValueInterface


Interface for OpenSTValue

### Function Summary

Signature | Returns | Details
--- | --- | ---
addCore<br/>(address) | success bool | Takes _core<br/><br/>Adds _core to cores by core.chainIdRemote
confirmRedemptionIntent<br/>(bytes32, address, uint256, uint256, uint256, bytes32) | amountST, expirationHeight | Takes _uuid, _redeemer, _redeemerNonce, _amountUT, _redemptionUnlockHeight, _redemptionIntentHash<br/><br/>Confirms redemption intent; emits RedemptionIntentConfirmed event
processStaking<br/>(bytes32) | stakeAddress | Takes _stakingIntentHash<br/><br/>Processes corresponding stake; emits ProcessedStake event
registerUtilityToken<br/>(string, string, uint256, uint256, address, bytes32) | uuid | Takes _symbol, _name, _conversionRate, _chainIdUtility, _stakingAccount, _checkUuid<br/><br/>Registers a utility token; emits UtilityTokenRegistered event

