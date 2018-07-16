/* solhint-disable-next-line compiler-fixed */
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
// Value chain: OpenST protocol interface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./CoreInterface.sol";
import "./EIP20Interface.sol";


contract OpenSTValueInterface {
    function processStaking(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret)
        external
        returns (address stakeAddress);

    function confirmRedemptionIntent(
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
        returns (
        uint256 amountST,
        uint256 expirationHeight);

    function addCore(
        CoreInterface _core)
        public
        returns (
        bool /* success */);

    function registerUtilityToken(
        string _symbol,
        string _name,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        uint256 _chainIdUtility,
        address _stakingAccount,
        bytes32 _checkUuid)
        public
        returns (
        bytes32 uuid);

    function stakes(
        bytes32 /* hashStakingIntent */)
        public
        returns (
        bytes32, /* uuid */
        address, /* staker */
        address, /* beneficiary */
        uint256, /* nonce */
        uint256, /* amountST */
        uint256, /* amountUT */
        uint256 /* unlockHeight */);

    function unstakes(
        bytes32 /* hashRedemptionIntent */)
        public
        returns (
        bytes32, /* uuid */
        address, /* redeemer */
        uint256, /* amountST */
        uint256, /* amountUT */
        uint256 /* expirationHeight */);

    function valueToken()
        public
        returns (EIP20Interface /* value token address*/);

    function stake(
        bytes32 _uuid,
        uint256 _amountST,
        address _beneficiary,
        bytes32 _hashLock,
        address _staker)
        external
        returns (
        uint256, /* amountUT*/
        uint256, /* nonce*/
        uint256, /* unlockHeight*/
        bytes32 /* stakingIntentHash*/);

    function revertStaking(
        bytes32 _stakingIntentHash)
        external
        returns (
        bytes32, /* uuid */
        uint256, /* amountST */
        address /* staker */);

    function getStakerAddress(bytes32 _stakingIntentHash)
        external
        returns (address /* staker */);
}