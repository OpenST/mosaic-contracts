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
import "./GateInterface.sol";

contract Gate is GateInterface, ProtocolVersioned, Owned {

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
    address private gateWorkers; //TODO: update type once workers contract and interfaces are added to the repo.

    // stake requests
    mapping(address /*staker */ => StakeRequest) private gateStakeRequests;

    // bounty amount
    uint256 private gateBounty;

    // utility token UUID
    bytes32 private gateUuid;


    /*
     *  Public functions
     */
    constructor(
        address _workers,
        uint256 _bounty,
        bytes32 _uuid,
        address _openSTProtocol)
        public
        Owned()
        ProtocolVersioned(_openSTProtocol)
    {
        require(_workers != address(0));
        require(_uuid.length != uint8(0));

        gateWorkers = _workers;
        gateBounty = _bounty;
        gateUuid = _uuid;

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
        require(gateStakeRequests[msg.sender].beneficiary == address(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transferFrom(msg.sender, address(this), _amount));

        gateStakeRequests[msg.sender] = StakeRequest({
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
        StakeRequest storage stakeRequest = gateStakeRequests[msg.sender];

        // check if the stake request exists for the msg.sender
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, stakeRequest.amount));

        uint256 stakeRequestAmount = stakeRequest.amount;
        delete gateStakeRequests[msg.sender];

        emit StakeRequestReverted(msg.sender, stakeRequestAmount);

        return true;
    }

    function rejectStakeRequest(address _staker)
        external
        returns (bool /* success */)
    {
        // check if the caller is whitelisted worker
        //require(gateWorkers.isWorker(msg.sender)); //TODO: revist this to add worker check

        StakeRequest storage stakeRequest = gateStakeRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // transfer the amount back
        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(_staker, stakeRequest.amount));

        uint256 stakeRequestAmount = stakeRequest.amount;
        // delete the stake request from the mapping storage
        delete gateStakeRequests[msg.sender];

        emit StakeRequestRejected(_staker, stakeRequestAmount);

        return true;
    }

    /// @dev In order to accept stake the staker needs to approve gate contract for bounty amount.
    ///      This can be called only by whitelisted worker address
    function acceptStakeRequest(address _staker, bytes32 _hashLock)
        external
        returns (bool /* success */)
    {
        // check if the caller is whitelisted worker
        //require(gateWorkers.isWorker(msg.sender)); //TODO: revist this to add worker check

        StakeRequest storage stakeRequest = gateStakeRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // check if _hashLock is not 0
        require(_hashLock != bytes32(0));

        // Transfer bounty amount form worker to gate contract
        require(OpenSTValueInterface(openSTProtocol).valueToken().transferFrom(msg.sender, address(this), gateBounty));

        // Approve OpenSTValue contract for stake amount
        require(OpenSTValueInterface(openSTProtocol).valueToken().approve(openSTProtocol, stakeRequest.amount));


        uint256 amountUT = 0;
        uint256 nonce = 0;
        uint256 unlockHeight = 0;
        bytes32 stakingIntentHash = bytes32(0);

        (amountUT, nonce, unlockHeight, stakingIntentHash) = OpenSTValueInterface(openSTProtocol).stake(
            gateUuid,
            stakeRequest.amount,
            stakeRequest.beneficiary,
            _hashLock,
            _staker);

        stakeRequest.unlockHeight = unlockHeight;
        stakeRequest.hashLock = _hashLock;

        //gateStakeRequests[_staker].unlockHeight = unlockHeight;
        //gateStakeRequests[_staker].hashLock = _hashLock;

        return true;
    }


  function processStaking(
    bytes32 _stakingIntentHash,
    bytes32 _unlockSecret,
    address _staker)
    external
    returns (bool /* success */)
  {
    // check if the caller is whitelisted worker
    //require(gateWorkers.isWorker(msg.sender)); //TODO: revist this to add worker check

    require(_stakingIntentHash != bytes32(0));
    require(_staker != address(0));

    StakeRequest storage stakeRequest = gateStakeRequests[_staker];

    // check if the stake request exists
    require(stakeRequest.beneficiary != address(0));

    // check if the stake request was accepted
    require(stakeRequest.hashLock != bytes32(0));

    // validate the unlockSecret.
    require(stakeRequest.hashLock == keccak256(_unlockSecret));

    OpenSTValueInterface(openSTProtocol).processStaking(_stakingIntentHash, _unlockSecret);
    
    // Transfer bounty amount to the msg.sender account
    require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, gateBounty));

    // delete the stake request from the mapping storage
    delete gateStakeRequests[msg.sender];

    return true;
  }

  /// @dev In order to revertStaking the msg.sender should be the staker
  function revertStaking(bytes32 _stakingIntentHash)
    external
    returns (bool /* success */)
  {

    // check if the caller is whitelisted worker
    //require(gateWorkers.isWorker(msg.sender)); //TODO: revist this to add worker check

    require(_stakingIntentHash != bytes32(0));

    StakeRequest storage stakeRequest = gateStakeRequests[msg.sender];

    // check if the stake request exists
    require(stakeRequest.beneficiary != address(0));

    // check if the stake request was accepted
    require(stakeRequest.hashLock != bytes32(0));

    // require that the stake is unlocked and exists
    require(stakeRequest.unlockHeight > 0);
    require(stakeRequest.unlockHeight <= block.number);

    bytes32 uuid = bytes32(0);
    uint256 amountST = uint256(0);
    address stakerAddress = address(0);
    (uuid, amountST, stakerAddress) = OpenSTValueInterface(openSTProtocol).revertStaking(_stakingIntentHash, msg.sender);

    require(stakerAddress == msg.sender);
    // Transfer bounty amount to the msg.sender account
    require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, gateBounty));

    // delete the stake request from the mapping storage
    delete gateStakeRequests[msg.sender];

    return true;
  }

  function workers()
        external
        returns (address)
    {
        return gateWorkers;
    }

    function bounty()
        external
        returns (uint256)
    {
        return gateBounty;
    }

    function uuid()
        external
        returns (bytes32)
    {
        return gateUuid;
    }

    function getOpenSTProtocol()
        external
        returns (address)
    {
        return openSTProtocol;
    }
}