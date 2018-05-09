/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.23;

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
// Value chain: Gate
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract GateInterface {

    /*
     * Events
     */
    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);
    event StakeRequestReverted(address _staker, uint256 _amount);
    event StakeRequestRejected(address _staker, uint256 _amount);

    function workers()
        external
        returns (address);

    function bounty()
        external
        returns (uint256);

    function uuid()
        external
        returns (bytes32);

    function getOpenSTProtocol()
        external
        returns (address);

    function requestStake(
        uint256 _amount,
        address _beneficiary)
        external
        returns ( bool /* success */);


    /// @dev In order to revert stake request the msg.sender should be the staker
    function revertStakeRequest()
        external
        returns (bool /* success */);

    function rejectStakeRequest(address _staker)
        external
        returns (bool /* success */);

    /// @dev In order to accept stake the staker needs to approve gate contract for bounty amount.
    ///      This can be called only by whitelisted worker address
    function acceptStakeRequest(address _staker, bytes32 _hashLock)
        external
        returns (bool /* success */);

    function processStaking(
        bytes32 _stakingIntentHash,
        bytes32 _unlockSecret,
        address _staker)
        external
        returns (bool /* success */);

    function revertStaking(bytes32 _stakingIntentHash)
        external
        returns (bool /* success */);

}