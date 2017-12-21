# OpenST Protocol Documentation

## Hasher


Protocol hash functions

### Function Summary

Signature | Returns | Details
--- | --- | ---
hashRedemptionIntent<br/>(bytes32, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _amountUT, _escrowUnlockHeight
hashStakingIntent<br/>(bytes32, address, uint256, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _beneficiary, _amountST, _amountUT, _escrowUnlockHeight
hashUuid<br/>(string, string, uint256, uint256, address, uint256) | bytes32 | Returns hash of _symbol, _name, _chainIdValue, _chainIdUtility, _openSTUtility, _conversionRate

