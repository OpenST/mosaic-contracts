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
import "./WorkersInterface.sol";

contract Gate is ProtocolVersioned, Owned {

    /*
     * Events
     */
    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);
    event StakeRequestReverted(address _staker, uint256 _amount);
    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);
    event StakeRequestAccepted(
      address _staker,
      uint256 _amountST,
      uint256 _amountUT,
      uint256 _nonce,
      uint256 _unlockHeight,
      bytes32 _stakingIntentHash);


    /*
     *  Structures
     */
    struct StakeRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary;
        bytes32 hashLock;
    }

    /*
     *  Storage
     */
    WorkersInterface public workers;

    // stake requests
    mapping(address /*staker */ => StakeRequest) public stakeRequests;

    // bounty amount
    uint256 public bounty;

    // utility token UUID
    bytes32 public uuid;


    /*
     *  Public functions
     */
    constructor(
        WorkersInterface _workers,
        uint256 _bounty,
        bytes32 _uuid,
        address _openSTProtocol)
        public
        Owned()
        ProtocolVersioned(_openSTProtocol)
    {
        require(_workers != address(0));
        require(_uuid.length != uint8(0));

        workers = _workers;
        bounty = _bounty;
        uuid = _uuid;

    }

    function requestStake(
        uint256 _amount,
        address _beneficiary)
        external
        returns (bool isSuccess)
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
        returns (uint256 stakeRequestAmount)
    {
        // only staker can do revertStakeRequest, msg.sender == staker
        StakeRequest storage stakeRequest = stakeRequests[msg.sender];

        // check if the stake request exists for the msg.sender
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, stakeRequest.amount));

        stakeRequestAmount = stakeRequest.amount;
        delete stakeRequests[msg.sender];

        emit StakeRequestReverted(msg.sender, stakeRequestAmount);

        return stakeRequestAmount;
    }

    function rejectStakeRequest(address _staker, uint8 _reason)
        external
        returns (uint256 stakeRequestAmount)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));

        StakeRequest storage stakeRequest = stakeRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // transfer the amount back
        require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(_staker, stakeRequest.amount));

        stakeRequestAmount = stakeRequest.amount;
        // delete the stake request from the mapping storage
        delete stakeRequests[msg.sender];

        emit StakeRequestRejected(_staker, stakeRequestAmount, _reason);

        return stakeRequestAmount;
    }

    /// @dev In order to accept stake the staker needs to approve gate contract for bounty amount.
    ///      This can be called only by whitelisted worker address
    function acceptStakeRequest(address _staker, bytes32 _hashLock)
        external
        returns (
        uint256 amountUT,
        uint256 nonce,
        uint256 unlockHeight,
        bytes32 stakingIntentHash)
    {
        // check if the caller is whitelisted worker
        require(workers.isWorker(msg.sender));

        StakeRequest storage stakeRequest = stakeRequests[_staker];

        // check if the stake request exists
        require(stakeRequest.beneficiary != address(0));

        // check if the stake request was not accepted
        require(stakeRequest.hashLock == bytes32(0));

        // check if _hashLock is not 0
        require(_hashLock != bytes32(0));

        // Transfer bounty amount form worker to gate contract
        require(OpenSTValueInterface(openSTProtocol).valueToken().transferFrom(msg.sender, address(this), bounty));

        // Approve OpenSTValue contract for stake amount
        require(OpenSTValueInterface(openSTProtocol).valueToken().approve(openSTProtocol, stakeRequest.amount));


        (amountUT, nonce, unlockHeight, stakingIntentHash) = OpenSTValueInterface(openSTProtocol).stake(
            uuid,
            stakeRequest.amount,
            stakeRequest.beneficiary,
            _hashLock,
            _staker);

        // Check if the stake function call did not result in to error.
        require(stakingIntentHash != bytes32(0));

        stakeRequests[_staker].unlockHeight = unlockHeight;
        stakeRequests[_staker].hashLock = _hashLock;

        emit StakeRequestAccepted(_staker, stakeRequest.amount, amountUT, nonce, unlockHeight, stakingIntentHash);

        return (amountUT, nonce, unlockHeight, stakingIntentHash);
    }


  function processStaking(
    bytes32 _stakingIntentHash,
    bytes32 _unlockSecret)
    external
    returns (uint256 stakeRequestAmount)
  {
    // check if the caller is whitelisted worker
    require(workers.isWorker(msg.sender));

    require(_stakingIntentHash != bytes32(0));

    //the hash timelock for staking and bounty are respectively in the openstvalue contract and gate contract in v0.9.3;
    //but all staking stateful information will move to the gate contract in v0.9.4 (making OpenST a library call)
    //and making this call obsolete
    address staker = OpenSTValueInterface(openSTProtocol).getStakerAddress(_stakingIntentHash);

    StakeRequest storage stakeRequest = stakeRequests[staker];

    // check if the stake request exists
    require(stakeRequest.beneficiary != address(0));

    // check if the stake request was accepted
    require(stakeRequest.hashLock != bytes32(0));

    // we call processStaking for OpenSTValue and get the stakeAddress on success.
    address stakerAddress = OpenSTValueInterface(openSTProtocol).processStaking(_stakingIntentHash, _unlockSecret);

    // check if the stake address is not 0
    require(stakerAddress != address(0));

    //If the msg.sender is whitelited worker then transfer the bounty amount to Workers contract
    //else transfer the bounty to msg.sender.
    if (workers.isWorker(msg.sender)) {
      // Transfer bounty amount to the workers contract address
      require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(workers, bounty));
    } else {
      //Transfer bounty amount to the msg.sender account
      require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(msg.sender, bounty));
    }
    stakeRequestAmount = stakeRequest.amount;
    // delete the stake request from the mapping storage
    delete stakeRequests[staker];

    return stakeRequestAmount;
  }


  function revertStaking(
    bytes32 _stakingIntentHash)
    external
    returns (uint256 stakeRequestAmount)
  {

    // check if the caller is whitelisted worker
    require(workers.isWorker(msg.sender));

    require(_stakingIntentHash != bytes32(0));

    //the hash timelock for staking and bounty are respectively in the openstvalue contract and gate contract in v0.9.3;
    //but all staking stateful information will move to the gate contract in v0.9.4 (making OpenST a library call)
    //and making this call obsolete
    address staker = OpenSTValueInterface(openSTProtocol).getStakerAddress(_stakingIntentHash);

    StakeRequest storage stakeRequest = stakeRequests[staker];

    // check if the stake request exists
    require(stakeRequest.beneficiary != address(0));

    // check if the stake request was accepted
    require(stakeRequest.hashLock != bytes32(0));

    bytes32 uuidR = bytes32(0);
    uint256 amountST = uint256(0);
    address stakerAddress = address(0);
    (uuidR, amountST, stakerAddress) = OpenSTValueInterface(openSTProtocol).revertStaking(_stakingIntentHash);

    // check if the stake address is not 0
    require(stakerAddress != address(0));

    require(OpenSTValueInterface(openSTProtocol).valueToken().transfer(workers, bounty));

    stakeRequestAmount = stakeRequest.amount;
    // delete the stake request from the mapping storage
    delete stakeRequests[staker];

    return stakeRequestAmount;
  }
}