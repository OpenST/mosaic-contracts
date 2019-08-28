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

import "./EIP20GatewayInterface.sol";
import "../lib/EIP20Interface.sol";
import "../lib/Mutex.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title StakerProxy is a contract that is deployed by the composer to allow
 *        staking of multiple users from within the same composer contract.
 * @notice The composer contract will deploy StakerProxy contracts on behalf of
 *         the owner. Only the owner can self-destruct the StakerProxy and
 *         receive all stored value.
 */
contract StakerProxy is Mutex {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    /** The composer that deployed this contract. */
    address public composer;

    /** The composer deployed the StakerProxy on behalf of the owner. */
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
    constructor(address payable _owner) public {
        composer = msg.sender;
        owner = _owner;
    }


    /* External Functions */

    /**
     * @notice Initiates the stake process. In order to stake, the stake and
     *         bounty amounts must first be transferred to the StakerProxy.
     *         Staked amount is then transferred to the Gateway contract.
     *         Bounty amount is also transferred to the Gateway contract.
     *
     * @param _amount Stake amount that will be transferred.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce The nonce to verify it is as expected.
     * @param _hashLock Hash lock provided by the facilitator.
     * @param _gateway On which gateway to stake.
     *
     * @return messageHash_ Message hash is unique for each request.
     */
    function stake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock,
        EIP20GatewayInterface _gateway
    )
        external
        onlyComposer
        mutex
        returns (bytes32 messageHash_)
    {
        approveTransfers(_gateway, _amount);

        messageHash_ = _gateway.stake(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _nonce,
            _hashLock
        );
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
            "The token address may not be address zero."
        );
        require(
            _token.transfer(_to, _value),
            "EIP20Token transfer returned false."
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


    /* Private Functions */

    /**
     * @notice Approves the transfer of the amount and bounty from this
     *         contract to the gateway.
     *
     * @param _gateway The gateway to approve the transfer for.
     * @param _amount The amount to stake.
     */
    function approveTransfers(
        EIP20GatewayInterface _gateway,
        uint256 _amount
    )
        private
    {
        EIP20Interface valueToken = _gateway.token();
        EIP20Interface baseToken = _gateway.baseToken();
        uint256 bounty = _gateway.bounty();

        /*
         * When valueToken and baseToken addresses are same, then the second
         * approval will override the first approval. So, in this case, total
         * approval amount is sum of bounty and staked amount.
         */
        if (address(valueToken) == address(baseToken)) {
            uint256 totalAmountToBeApproved = _amount.add(bounty);
            valueToken.approve(address(_gateway), totalAmountToBeApproved);
        } else {
            valueToken.approve(address(_gateway), _amount);
            baseToken.approve(address(_gateway), bounty);
        }
    }
}
