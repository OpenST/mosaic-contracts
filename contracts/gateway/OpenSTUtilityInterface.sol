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
// Utility chain: OpenSTUtilityInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

// import "./CoreInterface.sol";
import "./UtilityTokenInterface.sol";


contract OpenSTUtilityInterface {
    function confirmStakingIntent(
        bytes32 _uuid,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amountST,
        uint256 _amountUT,
        uint256 _stakingUnlockHeight,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes rlpParentNodes)
        external
        returns (
        uint256 expirationHeight);

    function processRedeeming(
        bytes32 _redemptionIntentHash,
        bytes32 _unlockSecret)
        external
        returns (
        address tokenAddress);

    function registerBrandedToken(
        string _symbol,
        string _name,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        address _requester,
        UtilityTokenInterface _brandedToken,
        bytes32 _checkUuid)
        public
        returns (
        bytes32 registeredUuid);

    function mints(
        bytes32 /* stakingIntentHash */)
        public
        returns (
        bytes32, /* uuid */
        address, /* staker */
        address, /* beneficiary */
        uint256, /* amount */
        uint256 /* expirationHeight */);

    function redemptions(
        bytes32 /* redemptionIntentHash */)
        public
        returns (
        bytes32, /* uuid */
        address, /* redeemer */
        uint256, /* amountUT */
        uint256 /* unlockHeight */);
}
