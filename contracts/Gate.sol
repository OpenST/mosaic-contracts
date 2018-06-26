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

/**
 *	@title Gate contract which implements ProtocolVersioned, Owned
 *
 *	@notice Gate contract is staking gate that seperates the concerns of staker and staking processor.
 *      Stake process is executed through Gate contract rather than directly with the protocol contract.
 *      The Gate contract will server the role of staking account rather than an external account.
 */
contract Gate is ProtocolVersioned, Owned {

    /* Events */

    /** Below event is emitted after successful execution of requestStake */
    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    /** Below event is emitted after successful execution of revertStakeRequest */
    event StakeRequestReverted(address _staker, uint256 _amount);

    /** Below event is emitted after successful execution of rejectStakeRequest */
    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);

    /** Below event is emitted after successful execution of acceptStakeRequest */
    event StakeRequestAccepted(
      address _staker,
      uint256 _amountST,
      uint256 _amountUT,
      uint256 _nonce,
      uint256 _unlockHeight,
      bytes32 _stakingIntentHash);


    /*  Storage */

    /** Storing stake requests */
    mapping(address /*staker */ => StakeRequest) public stakeRequests;

    /** Storing workers contract address */
    WorkersInterface public workers;

    /** Storing bounty amount that will be used while accepting stake */
    uint256 public bounty;

    /** Storing utility token UUID */
    bytes32 public uuid;

    /* Structures */
    struct StakeRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary;
        bytes32 hashLock;
    }

    /* Public functions */

    /**
      * @notice Contract constructor.
      *
      * @param _workers worker contract address.
      * @param _bounty bounty amount that worker address stakes while accepting stake request.
      * @param _uuid UUID of utility token.
      * @param _openSTProtocol OpenSTProtocol contract that governs staking.
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

    /**
      * @notice external function requestStake
      *
      * @dev In order to request stake the staker needs to approve gate contract for stake amount.
      *      This can be called by staker
      *      Staked amount is transferred from staker address to Gate contract
      *
      * @param _amount staking amount.
      * @param _beneficiary beneficiary address.
      *
      * @return success, boolean that specifies status of the execution.
      */
    function requestStake(
        uint256 _amount,
        address _beneficiary)
        external
        returns (bool /* success */)
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

    /**
      * @notice external function to revert requested stake.
      *
      * @dev This can be called only by staker
      *      Staked amount is transferred back to staker address from Gate contract
      *
      * @return stakeRequestAmount staking amount.
      */
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

    /**
      * @notice external function to reject requested stake.
      *
      * @dev This can be called only by whitelisted worker address
      *      Staked amount is transferred back to staker address from Gate contract
      *
      * @param _staker staker address.
      * @param _reason reason for rejection.
      *
      * @return stakeRequestAmount staking amount.
      */
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

    /**
      * @notice external function to accept requested stake.
      *
      * @dev In order to accept stake the staker needs to approve gate contract for bounty amount.
      *      This can be called only by whitelisted worker address
      *      OpenSTProtocol is approved for staking amount by Gate contract.
      *      Bounty amount is transferred from msg.sender to Gate contract
      *
      * @param _staker staker address.
      * @param _hashLock hash lock.
      *
      * @return amountUT branded token amount.
      * @return nonce staker nonce count.
      * @return unlockHeight height till what the amount is locked.
      * @return stakingIntentHash staking intent hash.
      */
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

    /**
      * @notice external function to process staking.
      *
      * @dev Bounty amount is to msg.sender if its not whitelisted worker
      *      Bounty amount is to workers contract if msg.sender is whitelisted worker
      *
      * @param _stakingIntentHash staking intent hash.
      * @param _unlockSecret unlock secret.
      *
      * @return stakeRequestAmount stake amount.
      */
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

    /**
      * @notice external function to revert staking.
      *
      * @dev Caller must be the whitelisted worker.
      *      Staked amount is transferred the staker address.
      *      Bounty amount is to workers contract.
      *
      * @param _stakingIntentHash staking intent hash.
      *
      * @return stakeRequestAmount staking amount.
      */
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