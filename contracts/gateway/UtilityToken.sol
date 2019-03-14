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

import "./UtilityTokenInterface.sol";
import "./EIP20Token.sol";
import "./CoGatewayUtilityTokenInterface.sol";
import "../lib/OrganizationInterface.sol";
import "../lib/Organized.sol";

/**
 *  @title UtilityToken is an EIP20Token and implements UtilityTokenInterface.
 *
 *  @notice This contract has increaseSupply and decreaseSupply functions that
 *          can be called only by CoGateway.
 *
 */
contract UtilityToken is EIP20Token, Organized, UtilityTokenInterface {

    /* events */

    /** Emitted whenever a CoGateway address is set */
    event CoGatewaySet(address _coGateway);


    /* Storage */

    /** Address of the EIP20 token (branded token) in origin chain. */
    EIP20Interface public token;

    /** Address of CoGateway contract. */
    address public coGateway;


    /* Modifiers */

    /** Checks that only CoGateway can call a particular function. */
    modifier onlyCoGateway() {

        require(
            msg.sender == address(coGateway),
            "Only CoGateway can call the function."
        );

        _;
    }


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @param _token Address of branded token.
     * @param _symbol Symbol of token.
     * @param _name Name of token.
     * @param _decimals Decimal of token.
     * @param _organization Address of a contract that manages organization.
     */
    constructor(
        EIP20Interface _token,
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        OrganizationInterface _organization
    )
        public
        Organized(_organization)
        EIP20Token(_symbol, _name, _decimals)
    {
        require(
            address(_token) != address(0),
            "Token address should not be zero."
        );

        token = _token;
    }


    /* External functions */

    /**
     * @notice Sets the CoGateway contract address. This can be called only by
     *         an organization address. This can be set only once.
     *
     * @param _coGatewayAddress CoGateway contract address
     *
     * @return success_ `true` if CoGateway address was set
     */
    function setCoGateway(
        address _coGatewayAddress
    )
        external
        onlyOrganization
        returns (bool success_)
    {
        require(
            coGateway == address(0),
            "CoGateway address is already set."
        );

        require(
            _coGatewayAddress != address(0),
            "CoGateway address should not be zero."
        );

        require(
            CoGatewayUtilityTokenInterface(_coGatewayAddress).utilityToken()
                == address(this),
            "CoGateway should be linked with this utility token."
        );

        coGateway = _coGatewayAddress;

        emit CoGatewaySet(coGateway);

        success_ = true;
    }

    /**
     * @notice Increases the total token supply. Also, adds the number of
     *         tokens to the beneficiary balance.
     *
     * @dev The parameters _account and _amount should not be zero. This check
     *      is added in function increaseSupplyInternal.
     *
     * @param _account Account address for which the balance will be increased.
                       This is payable so that it provides flexibility of
     *                 transferring base token to account on increase supply.
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if increase supply is successful, false otherwise.
     */
    function increaseSupply(
        address payable _account,
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool success_)
    {
        success_ = increaseSupplyInternal(_account, _amount);
    }

    /**
     * @notice Decreases the token supply.
     *
     * @dev The parameters _amount should not be zero. This check is added in
     *      function decreaseSupplyInternal.
     *
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if decrease supply is successful, false otherwise.
     */
    function decreaseSupply(
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool success_)
    {
        success_ = decreaseSupplyInternal(_amount);
    }


    /* Internal functions. */

    /**
     * @notice Internal function to increases the total token supply.
     *
     * @dev Adds number of tokens to beneficiary balance and increases the
     *      total token supply.
     *
     * @param _account Account address for which the balance will be increased.
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if increase supply is successful, false otherwise.
     */
    function increaseSupplyInternal(
        address _account,
        uint256 _amount
    )
        internal
        returns (bool success_)
    {
        // Increase the balance of the _account
        balances[_account] = balances[_account].add(_amount);
        totalTokenSupply = totalTokenSupply.add(_amount);

        /*
         * Creation of the new tokens should trigger a Transfer event with
         * _from as 0x0.
         */
        emit Transfer(address(0), _account, _amount);

        success_ = true;
    }

    /**
     * @notice Internal function to decreases the token supply.
     *
     * @dev Decreases the token balance from the msg.sender address and
     *      decreases the total token supply count.
     *
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if decrease supply is successful, false otherwise.
     */
    function decreaseSupplyInternal(
        uint256 _amount
    )
        internal
        returns (bool success_)
    {
        require(
            balances[msg.sender] >= _amount,
            "Insufficient balance."
        );

        // Decrease the balance of the msg.sender account.
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        totalTokenSupply = totalTokenSupply.sub(_amount);

        /*
         * Burning of the tokens should trigger a Transfer event with _to
         * as 0x0.
         */
        emit Transfer(msg.sender, address(0), _amount);

        success_ = true;
    }
}
