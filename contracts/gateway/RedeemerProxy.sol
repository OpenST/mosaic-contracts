pragma solidity ^0.5.0;

import "./EIP20CoGatewayInterface.sol";
import "../lib/Mutex.sol";

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

contract RedeemerProxy is Mutex {

    /* Storage */

    /** The composer that deployed this contract. */
    address public composer;

    /** The composer deployed the RedeemProxy on behalf of the owner. */
    address payable public owner;


    /* Modifiers */

    /** Requires that msg.sender is the composer */
    modifier onlyComposer() {
        require(
            msg.sender == address(composer),
            "This function can only be called by the composer."
        );

        _;
    }

    /** Requires that msg.sender is the owner. */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "This function can only be called by the owner."
        );

        _;
    }


    /* Special Functions */

    /**
     * @notice Must be constructed by a composer contract.
     *
     * @param _owner The owner that this proxy is deployed for.
     */
    constructor(address payable _owner)
        public
    {
        composer = msg.sender;
        owner = _owner;
    }
    /**
     * @notice Initiates the redeem process. In order to redeem, the redeem amount
     *         and bounty must first be transferred to the RedeemProxy.
     *         Redeem amount and bounty is transferred to co-gateway contract.
     *
     * @param _amount Amount that is to be redeem.
     * @param _beneficiary The address in the origin chain where value token
     *                     will be returned.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the redeem
     *                  and unstake process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Redeem proxy nonce specific to co-gateway.
     * @param _hashLock Hashlock provided by the facilitator.
     * @param _cogateway Address of the cogateway contract.
     *
     * @return messageHash_ Hash unique for each request.
     */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock,
        EIP20CoGatewayInterface _cogateway
    )
        external
        payable
        mutex
        onlyComposer
        returns(bytes32 messageHash_)
    {
        EIP20Interface utilityToken = _cogateway.utilityToken();
        uint256 bounty = _cogateway.bounty();

        require(
            bounty == msg.value,
            'Bounty amount must be received.'
        );

        utilityToken.approve(address(_cogateway),_amount);
        messageHash_  = _cogateway.redeem.value(bounty)(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _hashLock
        );
    }

    /**
     * @notice Destroys this contract. Make sure that you use `transferToken`
     *         to transfer all remaining token balance of this contract before
     *         calling this method.
     */
    function selfDestruct() external onlyComposer {
        selfdestruct(owner);
    }

    /**
     * @notice Transfers EIP20 token to destination address.
     *
     * @dev It is ok to to be able to transfer to the zero address.
     *
     * @param _token EIP20 token address.
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens to be transferred.
     */
    function transferToken(
        EIP20Interface _token,
        address _to,
        uint256 _value
    )
        external
        mutex
        onlyOwner
    {
        require(
            address(_token) != address(0),
            "The token address must not be address zero."
        );
        require(
            _token.transfer(_to, _value),
            "EIP20Token transfer returned false."
        );
    }

}
