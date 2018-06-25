# OpenST Protocol Documentation

## OpenSTUtility


Protocol for a utility chain

### Function Summary

Signature | Returns | Details
--- | --- | ---
checkAvailability<br/>(bytes32, bytes32, address) | bool | Takes _hashSymbol, _hashName, _requester<br/><br/>Checks whether branded token is available
completeOwnershipTransfer() | success bool | Sets proposedOwner to owner and proposedOwner to 0; only callable by proposedOwner; emits OwnershipTransferCompleted event
confirmStakingIntent<br/>(bytes32, address, uint256, address, uint256, uint256, uint256, bytes32) | expirationHeight | Takes _uuid, _staker, _stakerNonce, _beneficiary, _amountST, _amountUT, _stakingUnlockHeight, _stakingIntentHash<br/><br/>Confirms staking intent; emits StakingIntentConfirmed event; only callable by registrar
hashRedemptionIntent<br/>(bytes32, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _amountUT, _escrowUnlockHeight
hashStakingIntent<br/>(bytes32, address, uint256, address, uint256, uint256, uint256) | bytes32 | Returns hash of _uuid, _account, _accountNonce, _beneficiary, _amountST, _amountUT, _escrowUnlockHeight
hashUuid<br/>(string, string, uint256, uint256, address, uint256) | bytes32 | Returns hash of _symbol, _name, _chainIdValue, _chainIdUtility, _openSTUtility, _conversionRate
initiateOwnershipTransfer<br/>(address) | success bool | Takes _proposedOwner<br/><br/>Sets proposedOwner to _proposedOwner; only callable by owner; emits OwnershipTransferInitiated event
initiateProtocolTransfer<br/>(address, address) | success bool | Takes _token, _proposedProtocol<br/><br/>Initiates transfer to _proposedProtocol for _token; only callable by adminAddress
processMinting<br/>(bytes32) | tokenAddress | Takes _stakingIntentHash<br/><br/>Processes corresponding mint; emits ProcessedMint event
processRedeeming<br/>(bytes32) | tokenAddress | Takes _redemptionIntentHash<br/><br/>Processes corresponding redemption; emits ProcessedRedemption event
proposeBrandedToken<br/>(string, string, uint256) | btUuid | Takes _symbol _name _conversionRate. Congratulations on looking under the hood and obtaining ST' to call proposeBrandedToken<br/><br/>However, OpenSTFoundation is not yet actively listening to these events because to automate it we will build a web UI where you can authenticate with your msg.sender = _requester key; until that time please drop us a line on partners(at)simpletoken.org and we can work with you to register your branded token
redeem<br/>(bytes32, uint256, uint256) | unlockHeight, redemptionIntentHash | Takes _uuid, _amountBT, _nonce<br/><br/>Redeemer must set an allowance for the branded token with OpenSTUtility as the spender so that the branded token can be taken into escrow by OpenSTUtility; emits RedemptionIntentDeclared event. Note: for STPrime, call OpenSTUtility.redeemSTPrime as a payable function. Note: nonce must be queried from OpenSTValue contract
redeemSTPrime<br/>(uint256) | amountSTP, unlockHeight, redemptionIntentHash | Takes _nonce<br/><br/>Redeemer must send as value the amount STP to redeem; emits RedemptionIntentDeclared event. Note: nonce must be queried from OpenSTValue contract
registerBrandedToken<br/>(string, string, uint256, address, address, bytes32) | registeredUuid | Takes _symbol, _name, _conversionRate, _requester, _brandedToken, _checkUuid<br/><br/>Registers a branded token; emits RegisteredBrandedToken event; only callable by registrar
registeredTokenProperties<br/>(bytes32) | token address, registrar address | 
revertMinting<br/>(bytes32) | uuid, staker, beneficiary, amount | Takes _stakingIntentHash<br/><br/>Reverts corresponding mint; emits RevertedMint event
revertRedemption<br/>(bytes32) | uuid, redeemer, amountUT | Takes _redemptionIntentHash<br/><br/>Reverts corresponding redemption; emits RevertedRedemption event
revokeProtocolTransfer<br/>(address) | success bool | Takes _token<br/><br/>Revokes protocol transfer; on the very first released version v0.9.1 there is no need to completeProtocolTransfer from a previous version; only callable by adminAddress
setAdminAddress<br/>(address) | bool | Takes _adminAddress<br/><br/>Sets adminAddress to _adminAddress and returns true; only callable by owner or adminAddress; adminAddress can also be set to 0 to 'disable' it
setOpsAddress<br/>(address) | bool | Takes _opsAddress<br/><br/>Sets opsAddress to _opsAddress and returns true; only callable by owner or adminAddress; _opsAddress can also be set to 0 to 'disable' it

