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
import "../lib/EIP20GatewayInterface.sol";
import "../lib/EIP20Interface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * OSTComposer contract facilitates the staker to get the OSTPrime on sidechain.
 */
contract OSTComposer is Organized {

     /* Usings */

    using SafeMath for uint256;


    /* Constants */

    bytes32 constant public STAKEREQUEST_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "StakeRequest(address gateway,uint256 amount,address staker,address beneficiary,uint256 gasPrice,uint256 gasLimit, uint256 nonce)"
        )
    );


    /* Events */

    event StakeRequested(
        bytes32 stakeRequestHash,
        address indexed staker,
        uint256 amount,
        uint256 gasLimit,
        uint256 gasPrice,
        address gateway,
        address beneficiary
    );

    event StakeRevoked(
        bytes32 stakeRequestHash,
        address indexed staker
    );

    event StakeRejected(
        bytes32 stakeRequestHash,
        address indexed staker
    );


    /* Struct */

    struct StakeRequest {
        uint256 amount;
        address beneficiary;
        uint256 gasPrice;
        uint256 gasLimit;
        uint256 nonce;
        address staker;
        address gateway;
    }


    /* Public Variables */

    /* Stores hash of the stakerequest per staker to gateway. */
    mapping (address => mapping(address => bytes32))  public stakeRequestHashes;

    /* Stores StakerProxy contract address for the staker. */
    mapping (address => StakerProxy) public stakerProxies;

    /* Stores number of active request to gateways per staker. */
    mapping(address => uint256) public activeStakeRequestCount;

    /* Stores stake request per stake request hashes. */
    mapping (bytes32 => StakeRequest) public stakeRequests;


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
     *         to stake, the stake and bounty amounts must first be transferred
     *         to the OSTComposer. Staked amount is then transferred to the
     *         respective stakerproxy contract. Bounty amount is also transferred
     *         to the stakerproxy contract of the staker. Staker should approve
     *         OSTComposer for token transfer.
     *
     * @param _gateway Address of the gateway to stake.
     * @param _amount Amount that is to be staked.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce The nonce to verify it is as expected.
     *
     * @return stakeRequestHash_ Message hash is unique for each request.
     */
    function requestStake(
        address _gateway,
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce
    )
        external
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
            stakeRequestHashes[msg.sender][_gateway] == bytes32(0),
            "Request for this gateway is already in process"
        );

        stakeRequestHash_ = hashStakeRequest(
                                        _gateway,
                                        _amount,
                                        msg.sender,
                                        _beneficiary,
                                        _gasPrice,
                                        _gasLimit,
                                        _nonce
                                    );


        stakeRequestHashes[msg.sender][_gateway] = stakeRequestHash_;

        StakerProxy stakerProxy = stakerProxies[msg.sender];

        if(address(stakerProxy) == address(0)) {
            stakerProxy = new StakerProxy(address(this), msg.sender);
            stakerProxies[msg.sender] = stakerProxy;
        }

        uint256 stakerNonceFromGateway = EIP20GatewayInterface(_gateway).getNonce(address(stakerProxy));

        require(
            stakerNonceFromGateway == _nonce,
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
        activeStakeRequestCount[msg.sender].add(1);

        EIP20Interface token = EIP20GatewayInterface(_gateway).valueToken();

        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Staked amount must be transferred to Composer."
        );

        emit StakeRequested(
                stakeRequestHash_,
                msg.sender,
                _amount,
                _gasLimit,
                _gasPrice,
                _gateway,
                _beneficiary
        );

    }

    /**
     * @notice Facilitator calls the method to initiate the stake process.Staked
     *         amount and bounty amount is then transferred to the stakerproxy
     *         contract of the staker.
     *
     * @param _stakeRequestHash Unique hash for the stake request which is to be
     *                          Processed.
     * @param _hashLock Hashlock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for each request.
     */
    function acceptStakeRequest(
        bytes32 _stakeRequestHash,
        bytes32 _hashLock
    )
        onlyWorker
        external
        returns(bytes32 messageHash_)
    {
        require(
            _stakeRequestHash == bytes32(0),
            "Stake request hash is invalid"
        );

        StakeRequest storage stakeRequest = stakeRequests[_stakeRequestHash];
        address staker = stakeRequest.staker;
        require(
            staker != address(0),
            "Stake request must exists."
        );

        EIP20GatewayInterface gateway = EIP20GatewayInterface(stakeRequest.gateway);

        StakerProxy stakerProxy = stakerProxies[staker];

        delete stakeRequests[_stakeRequestHash];
        delete stakeRequestHashes[stakeRequest.staker][stakeRequest.gateway];
        EIP20Interface token = gateway.valueToken();
        require(
            token.transfer(address(stakerProxy), stakeRequest.amount),
            "Staked amount must be transferred to the staker proxy."
        );

        EIP20Interface baseToken = EIP20GatewayInterface(gateway).baseToken();
        uint256 bounty = gateway.bounty();
        require(
            baseToken.transferFrom(msg.sender, address(stakerProxy), bounty),
            "Bounty amount must be transferred to stakerProxy."
        );

        messageHash_ = StakerProxy(stakerProxy).stake(
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
     *
     * @return success_ `true` if stake request is deleted.
     */
    function revokeStakeRequest(
        bytes32 _stakeRequestHash
    )
        external
        returns(bool success_)
    {
        address staker = stakeRequests[_stakeRequestHash].staker;
        require(
            staker == address(0),
            "Invalid stake request hash."
        );
        require(
            staker == msg.sender,
            "Only valid staker can revoke the stake request."
        );

        activeStakeRequestCount[msg.sender].sub(1);

        address gateway = stakeRequests[_stakeRequestHash].gateway;
        delete stakeRequestHashes[staker][gateway];
        delete stakeRequests[_stakeRequestHash];

        EIP20Interface token = EIP20GatewayInterface(gateway).valueToken();

        uint256 amount = stakeRequests[_stakeRequestHash].amount;

        require(
            token.transfer(gateway, amount),
            "Staked amount must be transferred to staker."
        );

        emit StakeRevoked(_stakeRequestHash, msg.sender);

        success_ = true;
    }

    /**
     * @notice It can only be called by Facilitator. It deletes the previously requested
     *         stake request.
     *
     * @param _stakeRequestHash Hash of the stake request.
     *
     * @return success_ `true` if stake request is deleted.
     */
    function rejectStakeRequest(
        bytes32 _stakeRequestHash
    )
        external
        onlyWorker
        returns(bool success_)
    {
        StakeRequest storage stakeRequest = stakeRequests[_stakeRequestHash];
        require(stakeRequest.staker == address(0),"Invalid stake request hash.");

        address staker = stakeRequests[_stakeRequestHash].staker;
        activeStakeRequestCount[staker].sub(1);
        address gateway = stakeRequests[_stakeRequestHash].gateway;

        delete stakeRequests[_stakeRequestHash];
        delete stakeRequestHashes[stakeRequest.staker][stakeRequest.gateway];

        EIP20Interface token = EIP20GatewayInterface(gateway).valueToken();

        uint256 amount = stakeRequests[_stakeRequestHash].amount;
        require(
            token.transfer(staker, amount),
            "Staked amount must be transferred to staker."
        );

        emit StakeRejected(_stakeRequestHash, staker);

        success_ = true;
    }

    /**
     * @notice It can only be called by StakerProxy contract of the staker. It deletes
     *         the StakerProxy contract of the staker.
     *
     * @param _owner Owner of the StakerProxy contract.
     *
     * @return success_ `true` if StakerProxy contract of the staker is deleted.
     */
    function removeStakerProxy(
        address _owner
    )
        external
        returns(bool success_)
    {

        StakerProxy stakerProxy = stakerProxies[_owner];
        require(
            address(stakerProxy) == msg.sender,
            "Caller is invalid proxy address."
        );

        // Verify if any previous stake requests are pending.
        require(
            activeStakeRequestCount[_owner] == 0,
            "Stake request is active on gateways."
        );

        // Resetting the proxy address of the staker.
        delete stakerProxies[_owner];
        success_ = true;

    }


    /* Private Functions */

    /**
     * @notice It returns hashing of stake request as per EIP-712.
     */
    function hashStakeRequest(
        address _gateway,
        uint256 _amount,
        address _staker,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce
    )
        private
        pure
        returns(bytes32 stakeRequestIntentHash_)
    {
        stakeRequestIntentHash_ = keccak256(abi.encodePacked(
            STAKEREQUEST_INTENT_TYPEHASH,
            _gateway,
            _amount,
            _staker,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce
        ));
    }

}