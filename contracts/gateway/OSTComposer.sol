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
import "../lib/GatewayInterface.sol";
import "../lib/EIP20Interface.sol";

/**
 * OSTComposer contract facilitates the staker to get the OSTPrime on sidechain.
 */
contract OSTComposer is Organized {

    /* Constants */

    bytes32 constant public STAKEREQUEST_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "StakeRequest(address gateway,uint256 amount,address staker,address beneficiary,uint256 gasPrice,uint256 gasLimit, uint256 nonce)"
        )
    );

    bytes32 public constant DOMAIN_SEPARATOR_TYPEHASH = keccak256(
        "EIP712Domain(address verifyingContract)"
    );

    /* Events */

    event StakeRequested(
        bytes32 stakeRequestHash
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

    /* Stores hash of the stakerequest per staker to gateway */
    mapping (address => mapping(address => bytes32))  public stakerToGateway;

    /* Stores StakerProxy contract address for the staker */
    mapping (address => StakerProxy) public stakerProxies;

    /* Stores */
    mapping (address => bytes32) public stakeRequestHashes; //TODO : may not be needed

    /* */
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
     * @notice Initiates the stake process. In order to stake, the stake and
     *         bounty amounts must first be transferred to the OSTComposer.
     *         Staked amount is then transferred to the respective stakerproxy
     *         contract. Bounty amount is also transferred to the stakerproxy
     *         contract of the staker.
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

        bytes32 stakerGateway = stakerToGateway[msg.sender][_gateway];

        require(
            stakerGateway == bytes32(0),
            "Request for this gateway is already in process"
        );

        stakeRequestHash_ = hashStakeRequest( // TODO: EIP-712
                                        _gateway,
                                        _amount,
                                        msg.sender,
                                        _beneficiary,
                                        _gasPrice,
                                        _gasLimit,
                                        _nonce
                                    );


        stakerToGateway[msg.sender][_gateway] = stakeRequestHash_;

        StakerProxy stakerProxy = stakerProxies[msg.sender];

        if(address(stakerProxy) == address(0)) {
            StakerProxy proxy = new StakerProxy(address(this), msg.sender);
            stakerProxies[msg.sender] = proxy;
            stakerProxy = stakerProxies[msg.sender];
        }

        uint256 stakerNonceFromGateway = GatewayInterface(_gateway).getNonce(address(stakerProxy));

        require(stakerNonceFromGateway == _nonce,"Incorrect staker nonce");

        StakeRequest memory stakeRequest =  stakeRequests[stakeRequestHash_];

        require(
            stakeRequest.staker == address(0),
            "Same stake request is already in process"
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

        address token = GatewayInterface(_gateway).token();

        require(
            EIP20Interface(token).transferFrom(msg.sender, address(this), _amount),
            "Staked amount must be transferred to Composer."
        );

        emit StakeRequested(stakeRequestHash_);

    }

    // revisit it
    // take removeProxyStaker into consideration
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
        require(
            _hashLock == bytes32(0),
            "Invalid hashlock"
        );

        StakeRequest storage stakeRequest = stakeRequests[_stakeRequestHash];
        require(
            stakeRequest.staker != address(0),
            "Staker request must exists."
        );

        address requestedGateway = stakeRequest.gateway;

        GatewayInterface gateway = GatewayInterface(requestedGateway);
        delete stakeRequests[_stakeRequestHash];
        delete stakerToGateway[stakeRequest.staker][requestedGateway];

        uint256 bounty = gateway.bounty();

        address token = gateway.token();
        StakerProxy stakerProxy = stakerProxies[stakeRequest.staker];
        require(
            EIP20Interface(token).transferFrom(msg.sender, address(stakerProxy), stakeRequest.amount),
            "bounty amount must be transferred to stakerProxy."
        );

        address baseToken = GatewayInterface(gateway).baseToken();
        require(
            EIP20Interface(baseToken).transfer(address(stakerProxy), bounty),
            "Stake amount must be transferred to stakerProxy."
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
     * It can only be called by Staker of the stake request. It deletes the
     * previously requested stake request.
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
        StakeRequest storage stakeRequest = stakeRequests[_stakeRequestHash];
        require(stakeRequest.staker == address(0),"Invalid stake request hash.");
        require(stakeRequest.staker == msg.sender,"Only valid staker can revoke the stake request.");

        delete stakeRequestHashes[stakeRequest.staker];
        delete stakeRequests[_stakeRequestHash];
        delete stakerToGateway[stakeRequest.staker][stakeRequest.gateway];

        success_ = true;
    }

    /**
     * It can only be called by Facilitator. It deletes the previously requested
     * stake request.
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

        delete stakeRequestHashes[stakeRequest.staker];
        delete stakeRequests[_stakeRequestHash];
        delete stakerToGateway[stakeRequest.staker][stakeRequest.gateway];

        success_ = true;
    }

    /**
     * It can only be called by StakerProxy contract of the staker. It deletes
     * the StakerProxy contract of the staker.
     *
     * @param _owner Owner of the StakerProxy contract.
     *
     * @return success_ `true` if StakerProxy contract of the staker is deleted.
     */
    function removeStakerProxy(address _owner) external returns(bool success_)
    {

        StakerProxy stakerProxy = stakerProxies[_owner];
        require(address(stakerProxy) == msg.sender, "Caller is invalid proxy address");

        // verify if any stakeRequest is present

        bytes32 activeStakeRequest = stakeRequestHashes[_owner];

        StakeRequest storage stakeRequest = stakeRequests[activeStakeRequest];

        require(
            stakeRequest.staker != address(0),
            "Stake request is in already active state"
        );

        // resetting the proxy address for the staker.
        delete stakerProxies[_owner];
        success_ = true;

    }


    /* Private Functions */

    /**
     *
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

//    function hashEIP712TypedData(
//        bytes32 _structHash
//    )
//        private
//        view
//        returns (bytes32 eip712TypedDataHash_)
//    {
//        eip712TypedDataHash_ = keccak256(
//            abi.encodePacked(
//                "\x19",
//                "\x01",
//                domainSeparator,
//                _structHash
//            )
//        );
//    }

}