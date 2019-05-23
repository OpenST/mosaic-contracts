pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../../gateway/OSTComposer.sol";
import "../../gateway/StakerProxy.sol";

/**
 * @notice This contract is used to test acceptStakeRequest, revokeStakeRequest,
 *         revertStakeRequest and removeStakerProxy method of OSTComposer
 *         contract.
 */
contract TestOSTComposer is OSTComposer {

    /* Special Function */

    /**
     * @notice This is used for testing.
     *
     * @param _organization Address of the organization contract.
     */
    constructor(
        OrganizationInterface _organization
    )
        OSTComposer(_organization)
        public
    {

    }


    /* Public Functions */

    /**
     * @notice This is used for testing. It is used to set stakeRequestHashes
     *         storage.
     *
     * @param _stakeRequestHash Hash of the stake request.
     * @param _staker Address of the staker.
     * @param _gateway Address of the gateway contract.
     */
    function setStakeRequestHash(
        bytes32 _stakeRequestHash,
        address _staker,
        address _gateway
    )
        public
    {
        stakeRequestHashes[_staker][_gateway] = _stakeRequestHash;
    }

    /**
     * @notice This is used for testing. It is used to set the stakeRequests
     *         storage.
     *
     * @param _staker Address of the staker.
     * @param _gateway Address of the gateway contract.
     * @param _amount Amount to be staked.
     * @param _gasPrice Gas price which staker is willing to pay.
     * @param _gasLimit Gas limit which staker is willing to pay.
     * @param _beneficiary Address of the account on sidechains which will
     *                     receive OSTPrime.
     * @param _nonce Nonce of the staker.
     * @param _stakeHash Unique hash for the request.
     */
    function setStakeRequests(
        address _staker,
        address _gateway,
        uint256 _amount,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _beneficiary,
        uint256 _nonce,
        bytes32 _stakeHash
    )
        public
    {
        stakeRequests[_stakeHash] = StakeRequest({
            amount: _amount,
            beneficiary: _beneficiary,
            gasPrice: _gasPrice,
            gasLimit: _gasLimit,
            nonce: _nonce,
            staker: _staker,
            gateway: _gateway
        });
    }

    /**
     * @notice This is used for testing. It is used to set the stakerProxy
     *         storage.
     *
     * @param _staker Address of the staker.
     * @param _stakerProxy Address of the StakerProxy contract for the staker.
     */
    function setStakerProxy(
        address _staker,
        StakerProxy _stakerProxy
    )
        public
    {
        stakerProxies[_staker] = _stakerProxy;
    }

     /**
      * @notice This is used for testing. It is used to set the
      *         activeStakeRequestCount storage.
      *
      * @param _staker Address of the staker.
      * @param _count Count of the active gateway request by the staker.
      */
    function setActiveStakeRequestCount(
        address _staker,
        uint256 _count
    )
        public
    {
        activeStakeRequestCount[_staker] = _count;
    }

    /**
     * @notice This is used for testing. It is used to set the stakerProxy
     *         storage by creating the StakerProxy contract address for the staker.
     *
     * @param _staker Address of the staker.
     *
     * @return StakerProxy StakerProxy contract address for the staker.
     */
    function generateStakerProxy(
        address payable _staker
    )
        public
        returns(StakerProxy stakerProxy_)
    {
        stakerProxy_ = new StakerProxy(_staker);
        stakerProxies[_staker] = stakerProxy_;
    }
}
