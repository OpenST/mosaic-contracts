pragma solidity ^0.5.0;
// Copyright 2018 OpenST Ltd.
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
// Auxiliary Chain: CoGateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 * @title GatewayRedeemInterface interface.
 *
 * @notice An interface to call CoGateway redeem functions.
 */
contract GatewayRedeemInterface {

	/**
	 * @notice Get the current bounty amount.
	 *
	 * @return bounty_ Bounty amount.
	 */
	function bounty() external returns (uint256 bounty_);

	/**
	 * @notice Get the proposed bounty amount.
	 *
	 * @return proposedBounty_ Proposed bounty amount.
	 */
	function proposedBounty() external returns (uint256 proposedBounty_);

	/**
	 * @notice Get the proposed bounty unlock height.
	 *
	 * @return proposedBountyUnlockHeight_ Proposed bounty activation height.
	 */
	function proposedBountyUnlockHeight()
		external
		returns (uint256 proposedBountyUnlockHeight_);

	/**
	 * @notice Initiates the redeem process.
	 *
	 * @param _amount Redeem amount that will be transferred from redeemer
	 *                account.
	 * @param _beneficiary The address in the origin chain where the value
	 *                     tok ens will be released.
	 * @param _gasPrice Gas price that redeemer is ready to pay to get the
	 *                  redeem process done.
	 * @param _gasLimit Gas limit that redeemer is ready to pay
	 * @param _nonce Nonce of the redeemer address.
	 * @param _hashLock Hash Lock provided by the facilitator.
	 *
	 * @return messageHash_ which is unique for each request.
	 */
	function redeem(
		uint256 _amount,
		address _beneficiary,
		uint256 _gasPrice,
		uint256 _gasLimit,
		uint256 _nonce,
		bytes32 _hashLock
	)
		public
		payable
		returns (bytes32 messageHash_);


	/**
	 * @notice Revert the redeem process.
	 *
	 * @param _messageHash Message hash.
	 *
	 * @return redeemer_ Redeemer address
	 * @return redeemerNonce_ Redeemer nonce
	 * @return amount_ Redeem amount
	 */
	function revertRedeem(
		bytes32 _messageHash
	)
		payable
		external
		returns (
			address redeemer_,
			uint256 redeemerNonce_,
			uint256 amount_
		);

}
