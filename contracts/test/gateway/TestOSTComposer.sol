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
        external
    {
        stakeRequestHashes[_staker][_gateway] = _stakeRequestHash;
    }

    /**
     * @notice This is used for testing. It is used to set the stakeRequests
     *         storage.
     *
     * @param _stakeHash Unique hash for the request.
     * @param _value True/false boolean value.
     */
    function setStakeRequests(
        bytes32 _stakeHash,
        bool _value
    )
        external
    {
        stakeRequests[_stakeHash] = _value;
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
        external
    {
        stakerProxies[_staker] = _stakerProxy;
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
        external
        returns(StakerProxy stakerProxy_)
    {
        stakerProxy_ = new StakerProxy(_staker);
        stakerProxies[_staker] = stakerProxy_;
    }

    /** Removes a staker proxy for the specified staker for test purposes. */
    function destroyStakerProxy(
        address payable _staker
    )
        external
    {
        delete stakerProxies[_staker];
    }
}
