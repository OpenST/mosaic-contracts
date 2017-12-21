# OpenST Protocol Documentation

## OpenSTUtilityInterface


Interface for OpenSTUtility

### Function Summary

Signature | Returns | Details
--- | --- | ---
confirmStakingIntent<br/>(bytes32, address, uint256, address, uint256, uint256, uint256, bytes32) | expirationHeight | Takes _uuid _staker _stakerNonce _beneficiary _amountST _amountUT _stakingUnlockHeight _stakingIntentHash<br/><br/>Confirms staking intent; emits StakingIntentConfirmed event
processRedeeming<br/>(bytes32) | tokenAddress | Takes _redemptionIntentHash<br/><br/>Processes corresponding redemption; emits ProcessedRedemption event
registerBrandedToken<br/>(string, string, uint256, address, address, bytes32) | registeredUuid | Takes _symbol, _name, _conversionRate, _requester, _brandedToken, _checkUuid<br/><br/>Registers a branded token; emits RegisteredBrandedToken event

