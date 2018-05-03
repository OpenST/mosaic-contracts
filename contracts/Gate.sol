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
import "./OpenSTValue.sol";
import "./EIP20Interface.sol";

contract Gate is ProtocolVersioned {

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
    uint256 bounty;

    // utility token UUID
    bytes32 uuid;

    // OpenSTValue contract
    address openSTValue;

    /*
     *  Public functions
     */
    function Gate(
        address _workers,
        uint256 _bounty,
        bytes32 _uuid,
        address _openSTValue)
        public
        ProtocolVersioned(_openSTValue)
    {
        require(_workers != address(0));
        require(_openSTValue != address(0));
        require(_uuid.length != 0);

        // Should bounty with 0 amount be allowed ? commenting right now
        //require(_bounty > 0);

        workers = _workers;
        bounty = _bounty;
        uuid = _uuid;
        openSTValue = _openSTValue;
    }

    function requestStake(
        uint256 _amount,
        address _beneficiary)
        external
        returns (
            bool
        )
    {

        require(_amount > 0);
        require(_beneficiary != address(0));
        require(address(stakeRequests[msg.sender].beneficiary) == address(0)); // check if the state request does not exists

        require(EIP20Interface(openSTValue.valueToken).allowance(msg.sender, address(this)) >= _amount);
        require(EIP20Interface(openSTValue.valueToken).transferFrom(msg.sender, address(this), _amount));

        stakeRequests[msg.sender] = StakeRequest({
            amount: _amount,
            beneficiary: _beneficiary,
            hashLock: 0,
            unlockHeight: 0
            });

        StakeRequested(msg.sender, _amount, _beneficiary, 0);

        return unlockHeight;
    }

    function revertStakeRequest()
        returns (bool)
    {
        StakeRequest storage stakeRequest = stakeRequests[msg.sender];

        // check if the state request exists for the msg.sender
        require(address(stakeRequest.beneficiary) != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.unlockHeight == 0);

        require(EIP20Interface(openSTValue.valueToken).transfer(msg.sender, stakeRequest.amount));

        delete stakeRequests[msg.sender];

        StakeRequestReverted(msg.sender, stakeRequest.amount);

        return true;
    }


    function rejectRequest(address _staker)
        returns (bool)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender)); //TODO: revist this

        // check if the stake request was done.
        StakeRequest storage stakeRequest = stakeRequests[_staker];

        // check if the state request exists
        require(address(stakeRequest.beneficiary) != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.unlockHeight == 0);
        
        // transfer the amount back
        require(EIP20Interface(openSTValue.valueToken).transfer(msg.sender, stakeRequest.amount));

        // delete the state request from the mapping storage
        delete stakeRequests[msg.sender];

        StakeRequestRejected(_staker, stakeRequest.amount);

        return true;
    }
}