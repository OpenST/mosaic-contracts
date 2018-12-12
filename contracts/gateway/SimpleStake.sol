pragma solidity ^0.5.0;

// Copyright 2017 OpenST Ltd.
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

import "./EIP20Interface.sol";
import "../lib/SafeMath.sol";

/**
 *  @title SimpleStake contract
 *
 *  @notice This holds staked EIP20 tokens for a gateway.
 */
contract SimpleStake {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    /* Emitted when amount is un-staked */
    event ReleasedStake(
        address indexed _gateway,
        address indexed _to,
        uint256 _amount
    );


    /* Storage */

    /** EIP20 token contract that can be staked. */
    EIP20Interface public token;

    /** EIP20 gateway address. */
    address public gateway;


    /* Modifiers */

    /** checks that only gateway can call a particular function. */
    modifier onlyGateway() {
        require(
            msg.sender == gateway,
            "Only gateway can call the function."
        );
        _;
    }


    /* Constructor */

    /**
     *  @notice Contract constructor.
     *
     *  @param _token EIP20 token that will be staked.
     *  @param _gateway EIP20Gateway contract that governs staking.
     */
    constructor(
        EIP20Interface _token,
        address _gateway
    )
        public
    {
        require(
            address(_token) != address(0),
            "Token contract address must not be zero."
        );
        require(
            _gateway != address(0),
            "Gateway contract address must not be zero."
        );

        token = _token;
        gateway = _gateway;
    }


    /* External functions */

    /**
     *  @notice This allows gateway to release staked amount to provided address.
     *          Only gateway contract can call this method which defines set of rules
     *          on how the stake can be released and to who. Beneficiary address
     *          can be zero address in order to burn tokens.
     *
     *  @param _to Beneficiary of the amount of the stake.
     *  @param _amount Amount of stake to release to beneficiary.
     *
     *  @return success_ `true` if stake is released to beneficiary, `false` otherwise.
     */
    function releaseTo(
        address _to,
        uint256 _amount
    )
        external
        onlyGateway
        returns (bool success_)
    {
        require(
            _amount > 0,
            "Amount must not be zero."
        );
        require(
            token.transfer(_to, _amount) == true,
            "Token transfer must success."
        );

        emit ReleasedStake(msg.sender, _to, _amount);

        success_ = true;
    }

    /**
     *  @notice This function returns total staked amount.
     *
     *  @dev Total stake is the balance of the staking contract
     *       accidental transfers directly to SimpleStake bypassing
     *       the gateway will not mint new utility tokens,
     *       but will add to the total stake,
     *       (accidental) donations can not be prevented.
     *
     *  @return stakedAmount_ Total staked amount.
     */
    function getTotalStake()
        external
        view
        returns (uint256 stakedAmount_)
    {
            stakedAmount_ = token.balanceOf(address(this));
    }
}
