pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Common: Registrar
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpsManaged.sol";
// import "./CoreInterface.sol";
import "./OpenSTValueInterface.sol";
import "./OpenSTUtilityInterface.sol";

/**
 *  @title Registrar contract which implements OpsManaged.
 *
 *  @notice Contains functions that register for utility tokens.
 */
contract Registrar is OpsManaged {
	
	/** Storage */

	// mapping(uint256 /* chainId */ => CoreInterface) cores;

	/**  Public functions */

	/**
	 *  @notice Contract constructor.
	 */

	 constructor() public
	 	OpsManaged()
	 	{ }


	/**
	 *  @notice External function confirmRedemptionIntent.
	 *
	 *  @dev Only callable by Ops.
	 *
	 *  @param _uuid Uuid of the token.
	 *  @param _redeemer Address of the redeemer.
	 *  @param _redeemerNonce Nonce of the redeemer.
	 *  @param _beneficiary Address of beneficiary on the value chain.
	 *  @param _amountUT Amount of utility tokens to redeem.
	 *  @param _redemptionUnlockHeight Block height upto which redemption is locked.
	 *  @param _hashLock Hash lock for the redeem request.
	 *  @param _blockHeight Height when redemption intent hashed.
	 *  @param _rlpParentNodes Rlp encoded parent nodes.
	 *
	 *  @return uint256 amountST Amount of utility token equivalent OST redeemed.
	 *  @return uint256 expirationHeight Block height upto which redemption intent is valid. 
	 */
	 function confirmRedemptionIntent(
	 	// address of OpenSTValue registry:
	 	OpenSTValueInterface _registry,
	 	// OpenSTValue function:
	 	bytes32 _uuid,
	 	address _redeemer,
	 	uint256 _redeemerNonce,
	 	address _beneficiary,
	 	uint256 _amountUT,
	 	uint256 _redemptionUnlockHeight,
	 	bytes32 _hashLock,
	 	uint256 _blockHeight,
	 	bytes _rlpParentNodes)
	 	external
	 	onlyOps
	 	returns (
	 	uint256 amountST,
	 	uint256 expirationHeight)
	 	{
	 		(amountST, expirationHeight) = _registry.confirmRedemptionIntent(
	 		_uuid,
	 		_redeemer,
	 		_redeemerNonce,
	 		_beneficiary,
	 		_amountUT,
	 		_redemptionUnlockHeight,
	 		_hashLock,
	 		_blockHeight,
	 		_rlpParentNodes);

		return (amountST, expirationHeight);
	}

	/**
	 *  @notice Public function addCore.
	 *
	 *  @dev Only callable by Admin or Ops. 
	 *
	 *  @param _registry Address of OpenSTValue registry.
	 *  @param _core Address of CoreInterface contract.
	 *
	 *  @return bool True if core is registered on OpenSTValue, false otherwise.
	 */
	 function addCore(
		// address of OpenSTValue registry:
		OpenSTValueInterface _registry,
		// OpenSTValue function:
		CoreInterface _core)
		public
		onlyAdminOrOps
		returns (
		bool /* success */)
	{
		return _registry.addCore(_core);
	}

	/**
	 *  @notice Public function registerUtilityToken.
	 *
	 *  @dev Only callable by Admin or Ops.
	 *
	 *  @param _symbol Symbol of the token.
	 *  @param _name Name of the token.
	 *  @param _conversionRate Conversion rate of the token.
	 *  @param _conversionRateDecimals Decimal places of conversion rate of the token.
	 *  @param _chainIdUtility Chain id of the utility chain.
	 *  @param _stakingAccount Address of the staking account.
	 *  @param _checkUuid Uuid as the hash of regsiteration data.
	 *
	 *  @return bytes32 Keccak256 token uuid.
	 */
	 function registerUtilityToken(
		// address of OpenSTValue registry:
		OpenSTValueInterface _registry,
		// OpenSTValue function:
		string _symbol,
		string _name,
		uint256 _conversionRate,
		uint8 _conversionRateDecimals,
		uint256 _chainIdUtility,
		address _stakingAccount,
		bytes32 _checkUuid)
		public
		onlyAdminOrOps
		returns ( 
		bytes32 /* uuid */)
	{
		return _registry.registerUtilityToken(
			_symbol,
			_name,
			_conversionRate,
			_conversionRateDecimals,
			_chainIdUtility,
			_stakingAccount,
			_checkUuid);
	}

	/**
	 *  @notice External function processStaking.
	 *
	 *  @dev This can be deprecated as anyone with the unlockSecret,
	 *       can now call the processRedeeming function.
	 *
	 *  @param _stakingIntentHash Hash of staking intent variables.
	 *  @param _unlockSecret Unlock secret to the hash lock.
	 *
	 *  @return address Address at which ST is staked.
	 */
	 function processStaking(
		// address of OpenSTValue registry:
		OpenSTValueInterface _registry,
		// OpenSTValue function:
		bytes32 _stakingIntentHash,
		bytes32 _unlockSecret)
		external
		onlyAdmin
		returns (
		address stakeAddress)
	{
		return _registry.processStaking(
			_stakingIntentHash, _unlockSecret);
	}

	/**
	 *  @notice External function confirmStakingIntent.
	 *
	 *  @dev Callable only by Ops.
	 *
	 *  @param _uuid Uuid of the token.
	 *  @param _staker Address of the staker.
	 *  @param _stakerNonce Nonce of the staker.
	 *  @param _beneficiary Beneficiary address on utility chain.
	 *  @param _amountST Amount OST staked.
	 *  @param _amountUT Amount utility tokens to be minted.
	 *  @param _stakingUnlockHeight Height upto which stake is locked.
	 *  @param _hashLock Hash lock for the staking intent.
	 *  @param _blockHeight Height when staking intent hashed.
	 *  @param _rlpParentNodes Rlp encoded parent nodes. 
	 *
	 *  @return uint256 Expiration height Block height upto which staking intent is valid.
	 */
	 function confirmStakingIntent(
		// address of OpenSTUtility registry:
		OpenSTUtilityInterface _registry,
		// OpenSTUtility function:
		bytes32 _uuid,
		address _staker,
		uint256 _stakerNonce,
		address _beneficiary,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _stakingUnlockHeight,
		bytes32 _hashLock,
		uint256 _blockHeight,
		bytes _rlpParentNodes)
		external
		onlyOps
		returns (
		uint256 /* expirationHeight */)
	{
		return _registry.confirmStakingIntent(
			_uuid,
			_staker,
			_stakerNonce,
			_beneficiary,
			_amountST,
			_amountUT,
			_stakingUnlockHeight,
			_hashLock,
			_blockHeight,
			_rlpParentNodes);
	}

	/**
	 *  @notice Public function registerBrandedToken.
	 *
	 *  @param _registry Address of OpenSTUtility Interface contract.
	 *  @param _symbol Symbol of the token.
	 *  @param _name Name of the token.
	 *  @param _conversionRate Conversion rate of the token.
	 *  @param _conversionRateDecimals Decimal places of the conversion rate of the token.
	 *  @param _requester Address of the requester for registration. 
	 *  @param _brandedToken Address of the utility token interface.
	 *  @param _checkUuid UUID as the hash of registration data.
	 *
	 *  @return bytes32 Keccak256 of the registration data.
	 */
	 function registerBrandedToken(
		// address of OpenSTUtility registry:
		OpenSTUtilityInterface _registry,
		// OpenSTUtility function:
		string _symbol,
		string _name,
		uint256 _conversionRate,
		uint8 _conversionRateDecimals,
		address _requester,
		UtilityTokenInterface _brandedToken,
		bytes32 _checkUuid)
		public
		onlyAdminOrOps
		returns (
		bytes32 /* registeredUuid */)
	{
		return _registry.registerBrandedToken(
			_symbol,
			_name,
			_conversionRate,
			_conversionRateDecimals,
			_requester,
			_brandedToken,
			_checkUuid);
	}

	/**
	 *  @notice External function processRedeeming.
	 *
	 *  @dev Callable only by Admin. This can be deprecated as anyone with the unlockSecret,
	 *       can now call the processRedeeming function. 
	 *
	 *  @param _redemptionIntentHash Hash of the redemption intent data.
	 *  @param _unlockSecret Unlock secret to the hash lock.
	 *
	 *  @return address Address of the token.
	 */
	 function processRedeeming(
		// address of OpenSTUtility registry:
		OpenSTUtilityInterface _registry,
		// OpenSTUtility function:
		bytes32 _redemptionIntentHash,
		bytes32 _unlockSecret)
		external
		onlyAdmin
		returns (
		address tokenAddress)
		{
		return _registry.processRedeeming(
			_redemptionIntentHash, _unlockSecret);
	}
}
