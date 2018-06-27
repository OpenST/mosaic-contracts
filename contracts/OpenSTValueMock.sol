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
// Value chain: OpenSTValueMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpenSTValue.sol";

/// @title OpenSTValueMock
/// @dev Overrides certain durational constants and getters to ease testing OpenSTValue
contract OpenSTValueMock is OpenSTValue {
	uint256 private constant BLOCKS_TO_WAIT_LONG = 8;
	uint256 private constant BLOCKS_TO_WAIT_SHORT = 5;
	uint256 public intentsIndexPosition = 4; 
	bytes32 public intentsMappingKey = keccak256(0); 
	bytes32 public intentsMappingValue = keccak256(1);
	bytes32 public intentsMappingStorageKey = keccak256(bytes32(intentsMappingKey), uint256(intentsIndexPosition));

	/*
	 *  Public functions
	 */
	constructor(
		uint256 _chainIdValue,
		EIP20Interface _eip20token,
		address _registrar)
		OpenSTValue(_chainIdValue, _eip20token, _registrar)
		public { }

    function stake(
        bytes32 _uuid,
        uint256 _amountST,
        address _beneficiary,
        bytes32 _hashLock,
        address _staker)
        external
        returns (
        uint256 amountUT,
        uint256 nonce,
        uint256 unlockHeight,
        bytes32 stakingIntentHash)
        /* solhint-disable-next-line function-max-lines */
    {
        /* solhint-disable avoid-tx-origin */
        // check the staking contract has been approved to spend the amount to stake
        // OpenSTValue needs to be able to transfer the stake into its balance for
        // keeping until the two-phase process is completed on both chains.
        require(_amountST > uint256(0));

        require(utilityTokens[_uuid].simpleStake != address(0));
        require(_beneficiary != address(0));
        require(_staker != address(0));

        UtilityToken storage utilityToken = utilityTokens[_uuid];

        // if the staking account is set to a non-zero address,
        // then all transactions have come (from/over) the staking account
        if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);
        require(valueToken.transferFrom(msg.sender, address(this), _amountST));

        amountUT = (_amountST.mul(utilityToken.conversionRate))
            .div(10**uint256(utilityToken.conversionRateDecimals));
        unlockHeight = block.number + blocksToWaitLong();

        nonces[_staker]++;
        nonce = nonces[_staker];

        stakingIntentHash = hashStakingIntent(
            _uuid,
            _staker,
            nonce,
            _beneficiary,
            _amountST,
            amountUT,
            unlockHeight,
            _hashLock
        );

        stakes[stakingIntentHash] = Stake({
            uuid:         _uuid,
            staker:       _staker,
            beneficiary:  _beneficiary,
            nonce:        nonce,
            amountST:     _amountST,
            amountUT:     amountUT,
            unlockHeight: unlockHeight,
            hashLock:     _hashLock
        });

        // store the staking intent hash directly in storage of OpenSTValue 
        // so that a Merkle proof can be generated for active staking intents
        bytes32 intentKeyHash = hashIntentKey(_staker, nonce);
        intents[intentsMappingKey] = intentsMappingValue;
        emit StakingIntentDeclared(_uuid, _staker, nonce, intentKeyHash, _beneficiary,
            _amountST, amountUT, unlockHeight, stakingIntentHash, utilityToken.chainIdUtility);

        return (amountUT, nonce, unlockHeight, stakingIntentHash);
        /* solhint-enable avoid-tx-origin */
    }	

	function blocksToWaitLong() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_LONG;
	}

	function blocksToWaitShort() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_SHORT;
	}
}