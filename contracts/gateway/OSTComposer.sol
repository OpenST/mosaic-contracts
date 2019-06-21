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

import "../utilitytoken/contracts/organization/contracts/Organized.sol";
import "./StakerProxy.sol";
import "./EIP20GatewayInterface.sol";
import "../lib/EIP20Interface.sol";
import "../lib/Mutex.sol";
import "./ComposerInterface.sol";

/**
 * @title OSTComposer implements Organized contract. Reentrancy is prevented
 *        by using Mutex contract.
 *
 * @notice It facilitates the staker to get the OSTPrime on sidechains.
 */
contract OSTComposer is Organized, Mutex, ComposerInterface {

    /* Constants */

    bytes32 constant public STAKEREQUEST_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "StakeRequest(uint256 amount,address beneficiary,uint256 gasPrice,uint256 gasLimit,uint256 nonce,address staker,address gateway)"
        )
    );


    /* Events */

    /** Emitted whenever a request stake is called. */
    event StakeRequested(
        uint256 amount,
        address beneficiary,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        address indexed staker,
        address gateway,
        bytes32 stakeRequestHash
    );

    /** Emitted whenever a revoke stake is called. */
    event StakeRevoked(
        address indexed staker,
        bytes32 stakeRequestHash
    );

    /** Emitted whenever a reject stake is called. */
    event StakeRejected(
        address indexed staker,
        bytes32 stakeRequestHash
    );


    /* Struct */

    /**
     * StakeRequest stores the stake amount, beneficiary address, gas price, gas
     * limit, nonce, staker and gateway address.
     */
    struct StakeRequest {

        /** Amount that will be staked. */
        uint256 amount;

        /**
         * Address where the utility tokens will be minted in the
         * auxiliary chain.
         */
        address beneficiary;

        /** Gas price that staker is willing to pay. */
        uint256 gasPrice;

        /** Gas limit that staker is willing to pay. */
        uint256 gasLimit;

        /** Staker nonce at the gateway. */
        uint256 nonce;

        /** Address of the staker. */
        address staker;

        /** Address of the gateway where amount will be staked. */
        EIP20GatewayInterface gateway;
    }


    /* Public Variables */

    /* Mapping of staker to gateway to store stake request hash. */
    mapping (address => mapping(address => bytes32)) public stakeRequestHashes;

    /* Mapping of staker addresses to their StakerProxy. */
    mapping (address => StakerProxy) public stakerProxies;

    /* Stores all the parameters of stake request based on stake request hash. */
    mapping (bytes32 => StakeRequest) public stakeRequests;


    /* Modifiers */

    /** Requires that caller is valid proxy address. */
    modifier onlyStakerProxy(address _owner) {
        StakerProxy stakerProxy = stakerProxies[_owner];
        require(
            address(stakerProxy) == msg.sender,
            "Caller is invalid proxy address."
        );
        _;
    }


    /* Special Functions */

    /**
     * @notice Contract constructor.
     *
     * @param _organization Address of an organization contract.
     */
    constructor(
        OrganizationInterface _organization
    )
        Organized(_organization)
        public
    {

    }


    /* External Functions */

    /**
     * @notice Staker calls the method to show its intention of staking. In order
     *         to stake, the staked amount must first be transferred to
     *         OSTComposer. Staker should approve OSTComposer for token
     *         transfer.
     *
     * @param _amount Amount that is to be staked.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Staker nonce specific to gateway.
     * @param _gateway Address of the gateway to stake.
     *
     * @return stakeRequestHash_ A unique hash for stake request.
     */
    function requestStake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        EIP20GatewayInterface _gateway
    )
        external
        mutex
        returns (bytes32 stakeRequestHash_)
    {
        require(
            _amount > uint256(0),
            "Stake amount must not be zero."
        );
        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero."
        );

        require(
            stakeRequestHashes[msg.sender][address(_gateway)] == bytes32(0),
            "Request for this staker at this gateway is already in process."
        );

        stakeRequestHash_ = hashStakeRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            msg.sender,
            address(_gateway)
        );

        stakeRequestHashes[msg.sender][address(_gateway)] = stakeRequestHash_;

        StakerProxy stakerProxy = stakerProxies[msg.sender];

        if(address(stakerProxy) == address(0)) {
            stakerProxy = new StakerProxy(msg.sender);
            stakerProxies[msg.sender] = stakerProxy;
        }

        require(
            _gateway.getNonce(address(stakerProxy)) == _nonce,
            "Incorrect staker nonce."
        );

        stakeRequests[stakeRequestHash_] = StakeRequest({
            amount: _amount,
            beneficiary: _beneficiary,
            gasPrice: _gasPrice,
            gasLimit: _gasLimit,
            nonce: _nonce,
            staker: msg.sender,
            gateway: _gateway
        });

        EIP20Interface valueToken = _gateway.valueToken();

        require(
            valueToken.transferFrom(msg.sender, address(this), _amount),
            "Value token transfer returned false."
        );

        emit StakeRequested(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            msg.sender,
            address(_gateway),
            stakeRequestHash_
        );
    }

    /**
     * @notice Facilitator calls the method to initiate the stake process.
     *         Staked amount from composer and bounty amount from facilitator
     *         is then transferred to the StakerProxy contract of the staker.
     *
     * @param _stakeRequestHash Unique hash for the stake request which is to
     *                          be Processed.
     * @param _hashLock Hashlock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for each request.
     */
    function acceptStakeRequest(
        bytes32 _stakeRequestHash,
        bytes32 _hashLock
    )
        external
        onlyWorker
        returns(bytes32 messageHash_)
    {
        StakeRequest memory stakeRequest = stakeRequests[_stakeRequestHash];
        require(
            stakeRequest.staker != address(0),
            "Stake request must exists."
        );
        delete stakeRequestHashes[stakeRequest.staker][address(stakeRequest.gateway)];
        delete stakeRequests[_stakeRequestHash];

        EIP20GatewayInterface gateway = stakeRequest.gateway;

        StakerProxy stakerProxy = stakerProxies[stakeRequest.staker];
        require(
            address(stakerProxy) != address(0),
            "StakerProxy address is null."
        );

        EIP20Interface valueToken = gateway.valueToken();
        require(
            valueToken.transfer(address(stakerProxy), stakeRequest.amount),
            "Staked amount must be transferred to the staker proxy."
        );

        EIP20Interface baseToken = gateway.baseToken();
        uint256 bounty = gateway.bounty();
        require(
            baseToken.transferFrom(msg.sender, address(stakerProxy), bounty),
            "Bounty amount must be transferred to stakerProxy."
        );

        messageHash_ = stakerProxy.stake(
            stakeRequest.amount,
            stakeRequest.beneficiary,
            stakeRequest.gasPrice,
            stakeRequest.gasLimit,
            stakeRequest.nonce,
            _hashLock,
            stakeRequest.gateway
        );
    }

    /**
     * @notice It can only be called by Staker of the stake request. It deletes the
     *         previously requested stake request.
     *
     * @param _stakeRequestHash Hash of the stake request.
     */
    function revokeStakeRequest(
        bytes32 _stakeRequestHash
    )
        external
    {
        address staker = stakeRequests[_stakeRequestHash].staker;
        require(
            staker == msg.sender,
            "Only valid staker can revoke the stake request."
        );

        removeStakeRequest(_stakeRequestHash);

        emit StakeRevoked(staker, _stakeRequestHash);
    }

    /**
     * @notice It can only be called by Facilitator. It deletes the previously
     *         requested stake request.
     *
     * @param _stakeRequestHash Hash of the stake request.
     */
    function rejectStakeRequest(
        bytes32 _stakeRequestHash
    )
        external
        onlyWorker
    {
        address staker = stakeRequests[_stakeRequestHash].staker;
        require(
            staker != address(0),
            "Invalid stake request hash."
        );

        removeStakeRequest(_stakeRequestHash);

        emit StakeRejected(staker, _stakeRequestHash);
    }

    /**
     * @notice It can only be called by StakerProxy contract of the staker. It
     *         deletes the StakerProxy contract of the staker.
     *
     * @param _owner Owner of the StakerProxy contract.
     */
    function removeStakerProxy(
        address _owner
    )
        external
        onlyStakerProxy(_owner)
    {
        // Resetting the proxy address of the staker.
        delete stakerProxies[_owner];
    }


    /* Private Functions */

    /**
     * @notice It is used by revokeStakeRequest and removeStakeRequest methods.
     *         It transfers the value tokens to staker and deletes
     *         `stakeRequestHashes` and `stakeRequests` storage references.
     *
     * @param _stakeRequestHash Hash of the stake request.
     */
    function removeStakeRequest(
        bytes32 _stakeRequestHash
    )
        private
    {
        StakeRequest storage stakeRequest = stakeRequests[_stakeRequestHash];
        address staker = stakeRequests[_stakeRequestHash].staker;

        EIP20GatewayInterface gateway = stakeRequests[_stakeRequestHash].gateway;
        uint256 amount = stakeRequests[_stakeRequestHash].amount;

        delete stakeRequestHashes[staker][address(stakeRequest.gateway)];
        delete stakeRequests[_stakeRequestHash];

        EIP20Interface valueToken = gateway.valueToken();

        require(
            valueToken.transfer(staker, amount),
            "Staked amount must be transferred to staker."
        );
    }

    /**
     * @notice It returns hashing of stake request as per EIP-712.
     */
    function hashStakeRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _staker,
        address _gateway
    )
        private
        pure
        returns(bytes32 stakeRequestIntentHash_)
    {
        stakeRequestIntentHash_ = keccak256(
            abi.encodePacked(
                STAKEREQUEST_INTENT_TYPEHASH,
                _amount,
                _beneficiary,
                _gasPrice,
                _gasLimit,
                _nonce,
                _staker,
                _gateway
            ));
    }
}
