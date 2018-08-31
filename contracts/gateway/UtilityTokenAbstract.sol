/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.23;

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
// Utility chain: UtilityTokenAbstract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./ProtocolVersioned.sol";

/** utility chain contracts */
import "./UtilityTokenInterface.sol";

/**
 *  @title UtilityTokenAbstract contract which implements ProtocolVersioned, UtilityTokenInterface.
 *
 *  @notice Contains methods for utility tokens.
 */
contract UtilityTokenAbstract is ProtocolVersioned, UtilityTokenInterface {
    using SafeMath for uint256;

    /** Events */

    /**
     *  Minted raised when new utility tokens are minted for a beneficiary
     *  Minted utility tokens still need to be claimed by anyone to transfer
     *  them to the beneficiary.
     */
    event Minted(
        address indexed _beneficiary,
        uint256 _amount,
        uint256 _totalSupply
    );

    event Burnt(
        address indexed _account,
        uint256 _amount,
        uint256 _totalSupply
    );

    /** Storage */

    /** totalSupply holds the total supply of utility tokens */
    uint256 private totalTokenSupply;
    /** conversion rate for the utility token */
    uint256 private tokenConversionRate;
    /** conversion rate decimal factor */
    uint8 private tokenConversionRateDecimals;

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @dev Sets ProtocolVersioned with msg.sender address.
     *
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     */
    constructor(
        uint256 _conversionRate,
        uint8 _conversionRateDecimals
    )
    public
    ProtocolVersioned(msg.sender)
    {
        totalTokenSupply = 0;
        tokenConversionRate = _conversionRate;
        tokenConversionRateDecimals = _conversionRateDecimals;
    }

    /**
     *  @notice Public view function totalSupply.
     *
     *  @dev Get totalTokenSupply as view so that child cannot edit.
     *
     *  @return uint256 Total token supply.
     */
    function totalSupply()
    public
    view
    returns (uint256)
    {
        return totalTokenSupply;
    }

    /**
     *  @notice Public view function conversionRate.
     *
     *  @dev Get tokenConversionRate as view so that child cannot edit.
     *
     *  @return uint256 Token conversion rate.
     */
    function conversionRate()
    public
    view
    returns (uint256)
    {
        return tokenConversionRate;
    }

    /**
     *  @notice Public view function conversionRateDecimals.
     *
     *  @dev Get tokenConversionRateDecimal factor for utility token.
     *
     *  @return uint8 Token conversion rate decimals.
     */
    function conversionRateDecimals()
    public
    view
    returns (uint8)
    {
        return tokenConversionRateDecimals;
    }

    /** Internal functions */

    /**
     *  @notice Internal function mintInternal.
     *
     *  @param _beneficiary Address of the beneficiary.
     *  @param _amount Amount of tokens to mint.
     *
     *  @return bool True if tokens are minted, false otherwise.
     */
    function mintInternal(
        address _beneficiary,
        uint256 _amount)
    internal
    returns (bool)
    {
        totalTokenSupply = totalTokenSupply.add(_amount);

        emit Minted(_beneficiary, _amount, totalTokenSupply);

        return true;
    }

    /**
     *  @notice Internal function burnInternal.
     *
     *  @dev Burn utility tokens after having redeemed them
     *       through the protocol for the staked Simple token.
     *
     *  @param _burner Address of the burner of tokens.
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if tokens are burnt, false otherwise.
     */
    function burnInternal(
        address _burner,
        uint256 _amount)
    internal
    returns (bool /* success */)
    {
        totalTokenSupply = totalTokenSupply.sub(_amount);

        emit Burnt(_burner, _amount, totalTokenSupply);

        return true;
    }
}