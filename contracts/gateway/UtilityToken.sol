/* solhint-disable-next-line compiler-fixed */
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
// Auxiliary chain: UtilityToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../lib/SafeMath.sol";
import "./UtilityTokenInterface.sol";
import "./EIP20Token.sol";
import "./CoGatewayUtilityTokenInterface.sol";

/**
 *  @title UtilityToken is an EIP20Token and implements UtilityTokenInterface.
 *
 *  @notice This contract has mint and burn functions and can be called only
 *          by CoGateway. TODO: Add organization details.
 *
 */
contract UtilityToken is
    EIP20Token,
    UtilityTokenInterface
{
    using SafeMath for uint256;

    /* events */

    /** Emitted whenever a CoGateway address is set */
    event CoGatewaySet(
        address _utilityToken,
        address _coGateway
    );

    /* Storage */

    /** Address of the EIP20 token(VBT) in origin chain */
    address public valueToken;

    /** Address of CoGateway contract*/
    address public coGateway;

    /* Modifiers */

    /** checks that only organization can call a particular function. */
    modifier onlyCoGateway() {
        require(
            msg.sender == coGateway,
            "Only CoGateway can call the function"
        );
        _;
    }

    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @dev TODO: Sets Organization with msg.sender address.
     *
     * @param _symbol Symbol of token
     * @param _name Name of token
     * @param _decimals Decimal of token
     * @param _valueToken Address of value branded token
     */
    constructor(
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        address _valueToken
    )
        public
        EIP20Token(_symbol, _name, _decimals)
        //TODO: add organization
    {
        require(
            _valueToken != address(0),
            "ERC20 token should not be zero."
        );

        valueToken = _valueToken;
    }

    /* external functions */

    /**
     * @notice Sets the CoGateway contract address.
     *
     * @dev This will be set with zero gas. Can be called only by Organization
     *
     * @param _coGatewayAddress CoGateway contract address
     *
     * @return `true` if CoGateway address was set
     */
    function setCoGateway(address _coGatewayAddress)
        external
        //TODO: add organization
        returns (bool)
    {
        require(
            coGateway == address(0),
            "CoGateway address already set"
        );

        require(
            CoGatewayUtilityTokenInterface(_coGatewayAddress).utilityToken() ==
            address(this),
            "CoGateway is linked with some other utility token"
        );

        coGateway = _coGatewayAddress;

        emit CoGatewaySet(address(this), coGateway);
    }

    /**
     * @notice Mints the utility token
     *
     * @dev Adds _amount tokens to beneficiary balance and increases the
     *      totalTokenSupply. Can be called only by CoGateway.
     *
     * @param _beneficiary Address of tokens beneficiary.
     * @param _amount Amount of tokens to mint.
     *
     * @return bool `true` if mint is successful, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool /* success */)
    {
        // mint EIP20 tokens in contract address for them to be claimed
        balances[_beneficiary] = balances[_beneficiary].add(_amount);
        totalTokenSupply = totalTokenSupply.add(_amount);

        emit Minted(_beneficiary, _amount, totalTokenSupply, address(this));
        return true;
    }

    /**
     * @notice Burns the balance for the burner's address
     *
     * @dev only burns the amount from CoGateway address, So to burn
     *      transfer the amount to CoGateway.
     *
     * @param _amount Amount of tokens to burn.
     *
     * @return bool `true` if burn is successful, false otherwise.
     */
    function burn(
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool /* success */)
    {
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        totalTokenSupply = totalTokenSupply.sub(_amount);

        emit Burnt(msg.sender, _amount, totalTokenSupply, address(this));
        return true;
    }

}
