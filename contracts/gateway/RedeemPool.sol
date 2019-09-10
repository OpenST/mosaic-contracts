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

import "../utilitytoken/contracts/organization/contracts/OrganizationInterface.sol";
import "../lib/Mutex.sol";
import "../utilitytoken/contracts/organization/contracts/Organized.sol";
import "./EIP20CoGatewayInterface.sol";
import "./RedeemerProxy.sol";

/**
 *  @title RedeemPool contract. Reentrancy is prevented
 *        by using Mutex contract.
 *
 *  @notice It facilitates the redeemer to get redeem ost on origin chain.
 */
contract RedeemPool is Organized, Mutex {

    /* Constants */

    bytes32 constant public REDEEMREQUEST_INTENT_TYPEHASH = keccak256(
        abi.encode(
            "RedeemRequest(uint256 amount,address beneficiary,uint256 gasPrice,uint256 gasLimit,uint256 nonce,address redeemer,address cogateway)"
        )
    );

    /** Domain separator encoding per EIP 712. */
    bytes32 constant public EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(address verifyingContract)"
    );


    /* Events */

    /** Emitted whenever a request redeem is called. */
    event RedeemRequested(
        uint256 amount,
        address beneficiary,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        address indexed redeemer,
        address redeemerProxy,
        address cogateway,
        bytes32 redeemRequestHash
    );

    /** Emitted whenever a revoke redeem is called. */
    event RedeemRevoked(
        address indexed redeemer,
        bytes32 redeemRequestHash
    );

    /** Emitted whenever a reject redeem is called. */
    event RedeemRejected(
        address indexed redeemer,
        bytes32 redeemRequestHash
    );


    /* Public Variables */

    /** Domain separator per EIP 712. */
    bytes32 public DOMAIN_SEPARATOR = keccak256(
        abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            address(this)
        )
    );

    /* Mapping of redeemer to co-gateway to store redeem request hash. */
    mapping (address => mapping(address => bytes32)) public redeemRequestHashes;

    /* Mapping of redeemer addresses to their RedeemerProxy. */
    mapping (address => RedeemerProxy) public redeemerProxies;


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
     * @notice Redeemer calls the method to show its intention of redeem. In order
     *         to redeem, the redeem amount must first be transferred to
     *         Composer. Redeemer should approve Composer for token
     *         transfer.
     *
     * @param _amount Amount that is to be redeem.
     * @param _beneficiary The address in the origin chain where value token
     *                     will be returned.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the redeem
     *                  and unstake process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Redeem proxy nonce specific to co-gateway.
     * @param _cogateway Address of the cogateway contract.
     *
     * @return redeemRequestHash_ A unique hash for redeem request.
     */
    function requestRedeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        EIP20CoGatewayInterface _cogateway
    )
        external
        mutex
        returns (bytes32 redeemRequestHash_)
    {
        require(
            _amount > uint256(0),
            "Redeem amount must not be zero."
        );

        require(
            redeemRequestHashes[msg.sender][address(_cogateway)] == bytes32(0),
            "Request for this redeemer at this co-gateway is already in process."
        );

        redeemRequestHash_ = hashRedeemRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            msg.sender,
            address(_cogateway)
        );

        redeemRequestHashes[msg.sender][address(_cogateway)] = redeemRequestHash_;
        RedeemerProxy redeemerProxy = redeemerProxies[msg.sender];
        if(address(redeemerProxy) == address(0)) {
            redeemerProxy = new RedeemerProxy(msg.sender);
            redeemerProxies[msg.sender] = redeemerProxy;
        }

        require(
            _cogateway.getNonce(address(redeemerProxy)) == _nonce,
            "Incorrect redeemer nonce."
        );

        EIP20Interface utilityToken = _cogateway.utilityToken();

        require(
            utilityToken.transferFrom(msg.sender, address(this), _amount),
            "Utility token transfer returned false."
        );

        emit RedeemRequested(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            msg.sender,
            address(redeemerProxy),
            address(_cogateway),
            redeemRequestHash_
        );
    }

    /**
     * @notice Facilitator calls the method to initiate the redeem process.
     *         Redeem amount from composer and bounty amount from facilitator
     *         is then transferred to the RedeemerProxy contract of the redeemer.
     *
     * @param _amount Amount that is to be redeem.
     * @param _beneficiary The address in the origin chain where value token
     *                     will be returned.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the redeem
     *                  and unstake process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Redeem proxy nonce specific to co-gateway.
     * @param _cogateway Address of the cogateway contract.
     * @param _hashLock Hashlock provided by the facilitator.
     *
     * @return messageHash_ Hash unique for each request.
     */
    function acceptRedeemRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _redeemer,
        EIP20CoGatewayInterface _cogateway,
        bytes32 _hashLock
    )
        payable
        external
        onlyWorker
        returns(bytes32 messageHash_)
    {
        RedeemerProxy redeemerProxy = redeemerProxies[_redeemer];
        require(
            address(redeemerProxy) != address(0),
            "RedeemerProxy address is null."
        );

        uint256 bounty = _cogateway.bounty();
        require(
            bounty == msg.value,
            'Bounty amount must be received.'
        );

        bytes32 redeemRequestHash = hashRedeemRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _redeemer,
            address(_cogateway)
        );

        require(
            redeemRequestHash == redeemRequestHashes[_redeemer][address(_cogateway)],
            'Redeem request must exists.'
        );

        delete redeemRequestHashes[_redeemer][address(_cogateway)];
        EIP20Interface utilityToken = _cogateway.utilityToken();

        require(
            utilityToken.transfer(address(redeemerProxy), _amount),
            "Redeem amount must be transferred to the redeem proxy."
        );

        messageHash_ = redeemerProxy.redeem.value(bounty)(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _hashLock,
            _cogateway
        );
    }

    /**
     * @notice It can only be called by redeemer of the redeemer request.
     *
     * @param _amount Amount that is to be redeem.
     * @param _beneficiary The address in the origin chain where value token
     *                     will be returned.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the redeem
     *                  and unstake process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Redeem proxy nonce specific to co-gateway.
     * @param _cogateway Address of the cogateway contract.
     */
    function revokeRedeemRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        EIP20CoGatewayInterface _cogateway
    )
        external
    {
        address redeemer = msg.sender;
        bytes32 redeemRequestHash = hashRedeemRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            redeemer,
            address(_cogateway)
        );

        removeRedeemRequest(redeemer, _amount, _cogateway, redeemRequestHash);

        emit RedeemRevoked(redeemer, redeemRequestHash);
    }

    /**
     * @notice It can only be called by Facilitator/Worker. It rejects the redeem request.
     *
     * @param _amount Amount that is to be redeemed.
     * @param _beneficiary The address in the origin chain where value token
     *                     will be returned.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the redeem
     *                  and unstake process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Redeem proxy nonce specific to co-gateway.
     * @param _redeemer RedeemerProxy contract address of redeemer.
     * @param _cogateway Address of the cogateway.
     */
    function rejectRedeemRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _redeemer,
        EIP20CoGatewayInterface _cogateway
    )
        external
        onlyWorker
    {
        bytes32 redeemRequestHash = hashRedeemRequest(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _redeemer,
            address(_cogateway)
        );

        removeRedeemRequest(_redeemer, _amount, _cogateway, redeemRequestHash);

        emit RedeemRejected(_redeemer, redeemRequestHash);
    }

    /**
     * @notice It can only be called by owner of the redeemer proxy. It
     *         deletes the RedeemerProxy contract of the redeemer and calls self
     *         destruct on RedeemerProxy contract.
     */
    function destructRedeemerProxy()
        external
    {

        RedeemerProxy redeemerProxy = redeemerProxies[msg.sender];
        require(
            address(redeemerProxy) != address(0),
            "Redeemer proxy does not exist for the caller."
        );
        // Resetting the proxy address of the redeemer.
        delete redeemerProxies[msg.sender];
        redeemerProxy.selfDestruct();
    }


    /* Public Functions */

    /**
     * @notice It returns hash of redeem request as per EIP-712.
     *
     * @dev Hashing of redeem request should confirm with EIP-712.
     *      As specified by EIP 712, it requires
     *          - an initial byte
     *          - the version byte for structured data
     *          - the domain separator
     *          - hash obtained from params
     *
     *      See: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
     */
    function hashRedeemRequest(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        address _redeemer,
        address _cogateway
    )
        view
        public
        returns(bytes32 redeemRequestHash_)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                REDEEMREQUEST_INTENT_TYPEHASH,
                _amount,
                _beneficiary,
                _gasPrice,
                _gasLimit,
                _nonce,
                _redeemer,
                _cogateway
            ));

        // See: https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.sol
        redeemRequestHash_ = keccak256(
            abi.encodePacked(
                byte(0x19), // the initial 0x19 byte
                byte(0x01), // the version byte for structured data
                DOMAIN_SEPARATOR,
                hash
            )
        );
    }


    /* Private Functions */

    /**
     * @notice It is used by revokeRedeemRequest and rejectRedeemRequest methods.
     *         It transfers the utility tokens to redeemer and deletes
     *         `redeemRequestHashes` storage references.
     *
     * @param _redeemer address who initiates redeem.
     * @param _amount Amount that is to be redeemed.
     * @param _cogateway Address of the cogateway.
     * @param _redeemRequestHash Hash of redeem request.
     */
    function removeRedeemRequest(
        address _redeemer,
        uint256 _amount,
        EIP20CoGatewayInterface _cogateway,
        bytes32 _redeemRequestHash
    )
        private
    {

        require(
            _redeemRequestHash == redeemRequestHashes[_redeemer][address(_cogateway)],
            'Redeem request must exists.'
        );

        delete redeemRequestHashes[_redeemer][address(_cogateway)];

        EIP20Interface utilityToken = _cogateway.utilityToken();

        require(
            utilityToken.transfer(_redeemer, _amount),
            "Redeem amount must be transferred to redeemer."
        );
    }
}
