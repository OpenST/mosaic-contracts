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

import "./ProtocolVersioned.sol";
import "./OpenSTValueInterface.sol";
import "./EIP20Interface.sol";
import "./Owned.sol";

contract Gate is ProtocolVersioned, Owned {

    /*
     * Events
     */
    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);
    event StakeRequestReverted(address _staker, uint256 _amount);
    event StakeRequestRejected(address _staker, uint256 _amount);

    /*
     *  Structures
     */
    struct StakeRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary; //The token holder contract in the future 
        bytes32 hashLock;
    }

    /*
     *  Storage
     */
    address public workers; //TODO: update type once workers contract and interfaces are added to the repo.

    // stake requests
    mapping(address /*staker */ => StakeRequest) public stakeRequests;

    // bounty amount
    uint256 private bounty;

    // utility token UUID
    bytes32 private uuid;


    /*
     *  Public functions
     */
    constructor(
        address _workers,
        uint256 _bounty,
        bytes32 _uuid,
        address _openSTValue)
        public
        Owned()
        ProtocolVersioned(_openSTValue)
    {
        require(_workers != address(0));
        require(_openSTValue != address(0));
        require(_uuid.length != bytes32(0));

        workers = _workers;
        bounty = _bounty;
        uuid = _uuid;

    }

    function requestStake(
        uint256 _amount,
        address _beneficiary)
        external
        returns ( bool /* success */)
    {

        require(_amount > uint256(0));
        require(_beneficiary != address(0));

        // check if the stake request does not exists
        require(stakeRequests[msg.sender].beneficiary == address(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transferFrom(msg.sender, address(this), _amount));

        stakeRequests[msg.sender] = StakeRequest({
            amount: _amount,
            beneficiary: _beneficiary,
            hashLock: 0,
            unlockHeight: 0
        });

        emit StakeRequested(msg.sender, _amount, _beneficiary);

        return true;
    }


    /// @dev In order to revert stake request the msg.sender should be the staker
    function revertStakeRequest()
        external
        returns (bool /* success */)
    {
        // only staker can do revertStakeRequest, msg.sender == staker
        StakeRequest storage stakeRequest = stakeRequests[msg.sender];

        // check if the stake request exists for the msg.sender
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, stakeRequest.amount));

        uint256 stakeRequestAmount = stakeRequest.amount;
        delete stakeRequests[msg.sender];

        emit StakeRequestReverted(msg.sender, stakeRequestAmount);

        return true;
    }

    function rejectStakeRequest(address _staker)
        external
        returns (bool /* success */)
    {
        // check if the caller is whitelisted worker
        //require(workers.isWorker(msg.sender)); //TODO: revist this to add worker check

        StakeRequest storage stakeRequest = stakeRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // transfer the amount back
        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(_staker, stakeRequest.amount));

        uint256 stakeRequestAmount = stakeRequest.amount;
        // delete the stake request from the mapping storage
        delete stakeRequests[msg.sender];

        emit StakeRequestRejected(_staker, stakeRequestAmount);

        return true;
    }

}