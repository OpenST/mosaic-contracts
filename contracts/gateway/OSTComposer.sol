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

/**
 * @title OSTComposer implements Organized contract. Reentrancy is prevented
 *        by using Mutex contract.
 *
 * @notice It facilitates the staker to get the OSTPrime on sidechains.
 */
contract OSTComposer is Organized, Mutex {

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


    /* Public Variables */

    /* Mapping of staker to gateway to store stake request hash. */
    mapping (address => mapping(address => bytes32)) public stakeRequestHashes;

    /* Mapping of staker addresses to their StakerProxy. */
    mapping (address => StakerProxy) public stakerProxies;

    /* Stores boolean based on stake request hash. */
    mapping (bytes32 => bool) public stakeRequests;

    /* Private Variables */

    /** Domain separator encoding per EIP 712. */
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(address verifyingContract)"
    );

    /** Domain separator per EIP 712. */
    bytes32 private DOMAIN_SEPARATOR = keccak256(
        abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            address(this)
        )
    );


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

        stakeRequests[stakeRequestHash_] = true;

        EIP20Interface valueToken = _gateway.token();

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
     * @param _amount Amount that is to be staked.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Staker nonce specific to gateway.
     * @param _staker StakerProxy contract address of staker.
     * @param _gateway Address of the gateway to stake.
     * @param _hashLock Hashlock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for each request.
     */
    function acceptStakeRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _staker,
        EIP20GatewayInterface _gateway,
        bytes32 _hashLock
    )
        external
        onlyWorker
        returns(bytes32 messageHash_)
    {
        StakerProxy stakerProxy = stakerProxies[_staker];
        require(
            address(stakerProxy) != address(0),
            "StakerProxy address is null."
        );

        bytes32 stakeRequestHash = hashStakeRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _staker,
            address(_gateway)
        );
        require(
            stakeRequests[stakeRequestHash],
            "Stake request must exists."
        );
        delete stakeRequestHashes[_staker][address(_gateway)];
        delete stakeRequests[stakeRequestHash];

        EIP20Interface valueToken = _gateway.token();
        require(
            valueToken.transfer(address(stakerProxy), _amount),
            "Staked amount must be transferred to the staker proxy."
        );

        EIP20Interface baseToken = _gateway.baseToken();
        uint256 bounty = _gateway.bounty();
        require(
            baseToken.transferFrom(msg.sender, address(stakerProxy), bounty),
            "Bounty amount must be transferred to stakerProxy."
        );

        messageHash_ = stakerProxy.stake(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _hashLock,
            _gateway
        );
    }

    /**
     * @notice It can only be called by Staker of the stake request. It deletes the
     *         previously requested stake request.
     *
     * @param _amount Amount that is to be staked.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Staker nonce specific to gateway.
     * @param _gateway Address of the gateway to stake.
     */
    function revokeStakeRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        EIP20GatewayInterface _gateway
    )
        external
    {
        address staker = msg.sender;
        bytes32 stakeRequestHash = hashStakeRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            staker,
            address(_gateway)
        );

        require(
            stakeRequests[stakeRequestHash],
            "Only valid staker can revoke the stake request."
        );

        removeStakeRequest(staker, _amount, _gateway, stakeRequestHash);

        emit StakeRevoked(staker, stakeRequestHash);
    }

    /**
     * @notice It can only be called by Facilitator. It deletes the previously
     *         requested stake request.
     *
     * @param _amount Amount that is to be staked.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Staker nonce specific to gateway.
     * @param _staker StakerProxy contract address of staker.
     * @param _gateway Address of the gateway to stake.
     */
    function rejectStakeRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _staker,
        EIP20GatewayInterface _gateway
    )
        external
        onlyWorker
    {
        bytes32 stakeRequestHash = hashStakeRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _staker,
            address(_gateway)
        );
        require(
            stakeRequests[stakeRequestHash],
            "Invalid stake request hash."
        );

        removeStakeRequest(_staker, _amount, _gateway, stakeRequestHash);

        emit StakeRejected(_staker, stakeRequestHash);
    }

    /**
     * @notice It can only be called by owner of the staker proxy. It
     *         deletes the StakerProxy contract of the staker and calls self
     *         destruct on StakerProxy contract.
     */
    function destructStakerProxy()
        external
    {

        StakerProxy stakerProxy = stakerProxies[msg.sender];
        require(
            address(stakerProxy) != address(0),
            "Staker proxy does not exist for the caller."
        );
        // Resetting the proxy address of the staker.
        delete stakerProxies[msg.sender];
        stakerProxy.selfDestruct();
    }


    /* Private Functions */

    /**
     * @notice It is used by revokeStakeRequest and removeStakeRequest methods.
     *         It transfers the value tokens to staker and deletes
     *         `stakeRequestHashes` storage references.
     *
     * @param _staker StakerProxy contract address of staker.
     * @param _amount Amount that is to be staked.
     * @param _gateway Address of the gateway to stake.
     * @param _stakeRequestHash Stake request intent hash.
     */
    function removeStakeRequest(
        address _staker,
        uint256 _amount,
        EIP20GatewayInterface _gateway,
        bytes32 _stakeRequestHash
    )
        private
    {
        delete stakeRequestHashes[_staker][address(_gateway)];
        delete stakeRequests[_stakeRequestHash];

        EIP20Interface valueToken = _gateway.token();

        require(
            valueToken.transfer(_staker, _amount),
            "Staked amount must be transferred to staker."
        );
    }

    /**
     * @notice It returns hashing of stake request as per EIP-712.
     *
     * @dev Hashing of stakeRequest should confirm with EIP-712.
     *      As specified by EIP 712, it requires
     *          - an initial byte
     *          - the version byte for structured data
     *          - the domain separator
     *          - hash obtained from params
     *
     *      See: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
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
        view
        returns(bytes32 stakeRequestIntentHash_)
    {

        bytes32 hash = keccak256(
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

        // See: https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.sol
        stakeRequestIntentHash_ = keccak256(
            abi.encodePacked(
                byte(0x19), // the initial 0x19 byte
                byte(0x01), // the version byte for structured data
                DOMAIN_SEPARATOR,
                hash
            )
        );
    }
}
