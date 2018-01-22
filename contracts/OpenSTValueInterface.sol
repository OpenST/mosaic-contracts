/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.17;

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
        bytes32 _redemptionIntentHash)
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
}
