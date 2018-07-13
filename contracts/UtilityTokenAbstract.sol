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
import "./Hasher.sol";
import "./ProtocolVersioned.sol";

/** utility chain contracts */
import "./UtilityTokenInterface.sol";

/**
 *  @title UtilityTokenAbstract contract which implements Hasher, ProtocolVersioned, UtilityTokenInterface.
 *
 *  @notice Contains methods for utility tokens.
 */
contract UtilityTokenAbstract is Hasher, ProtocolVersioned, UtilityTokenInterface {
    using SafeMath for uint256;
    
    /** Events */

    /** 
     *  Minted raised when new utility tokens are minted for a beneficiary
     *  Minted utility tokens still need to be claimed by anyone to transfer
     *  them to the beneficiary.
     */
    event Minted(bytes32 indexed _uuid, address indexed _beneficiary,
        uint256 _amount, uint256 _unclaimed, uint256 _totalSupply);

    event Burnt(bytes32 indexed _uuid, address indexed _account,
        uint256 _amount, uint256 _totalSupply);
    
    /** Storage */

    /** UUID for the utility token */
    bytes32 private tokenUuid;
    /** totalSupply holds the total supply of utility tokens */
    uint256 private totalTokenSupply;
    /** conversion rate for the utility token */
    uint256 private tokenConversionRate;
    /** conversion rate decimal factor */
    uint8 private tokenConversionRateDecimals;
    /** tokenChainIdValue is an invariant in the tokenUuid calculation */
    uint256 private tokenChainIdValue;
    /** tokenChainIdUtility is an invariant in the tokenUuid calculation */
    uint256 private tokenChainIdUtility;
    /** tokenOpenSTUtility is an invariant in the tokenUuid calculation */
    address private tokenOpenSTUtility;
    /** claims is follows EIP20 allowance pattern but */
    /** for a staker to stake the utility token for a beneficiary */
    mapping(address => uint256) private claims;

    /** Public functions */

    /**
     *  @notice Contract constructor. 
     *
     *  @dev Sets ProtocolVersioned with msg.sender address.
     *
     *  @param _uuid UUID of the token.
     *  @param _symbol Symbol of the token.
     *  @param _name Name of the token.
     *  @param _chainIdValue Chain id of the value chain.
     *  @param _chainIdUtility Chain id of the utility chain.
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     */    
    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        ProtocolVersioned(msg.sender)
    {
        tokenUuid = hashUuid(
            _symbol,
            _name,
            _chainIdValue,
            _chainIdUtility,
            msg.sender,
            _conversionRate,
            _conversionRateDecimals);

        require(tokenUuid == _uuid);

        totalTokenSupply = 0;
        tokenConversionRate = _conversionRate;
        tokenConversionRateDecimals = _conversionRateDecimals;
        tokenChainIdValue = _chainIdValue;
        tokenChainIdUtility = _chainIdUtility;
        tokenOpenSTUtility = msg.sender;
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
     *  @notice Public view function uuid.
     *
     *  @dev Get tokenUuid as view so that child cannot edit.
     *
     *  @return bytes32 Token UUID.
     */       
    function uuid()
        public
        view
        returns (bytes32)
    {
        return tokenUuid;
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

    /**
     *  @notice Public view function genesisChainIdValue.
     *
     *  @dev Get tokenChainIdValue as view so that child cannot edit.
     *
     *  @return uint256 Token genesis chain id value.
     */       
    function genesisChainIdValue()
        public
        view
        returns (uint256)
    {
        return tokenChainIdValue;
    }

    /**
     *  @notice Public view function genesisChainIdUtility.
     *
     *  @dev Get tokenChainIdUtility as view so that child cannot edit.
     *
     *  @return uint256 Token chain id utility.
     */       
    function genesisChainIdUtility()
        public
        view
        returns (uint256)
    {
        return tokenChainIdUtility;
    }

    /**
     *  @notice Public view function genesisOpenSTUtility.
     *
     *  @dev Get tokenOpenSTUtility as view so that child cannot edit.
     *
     *  @return address Genesis OpenSTUtility address.
     */       
    function genesisOpenSTUtility()
        public
        view
        returns (address)
    {
        return tokenOpenSTUtility;
    }

    /**
     *  @notice Public view function unclaimed.
     *
     *  @param _beneficiary Address of the beneficiary.
     *
     *  @dev Returns unclaimed amount for beneficiary.
     *
     *  @return uint256 Unclaimed amount in beneficiary account. 
     */       
    function unclaimed(
        address _beneficiary)
        public
        view
        returns (uint256)
    {
        return claims[_beneficiary];
    }

    /** Internal functions */

    /**
     *  @notice Internal function claimInternal.
     *
     *  @dev Claim transfers all utility tokens to _beneficiary.
     *
     *  @param _beneficiary Address of the beneficiary.
     *
     *  @return uint256 Amount of tokens to be claimed by beneficiary.
     */
    function claimInternal(
        address _beneficiary)
        internal
        returns (uint256 amount)
    {
        amount = claims[_beneficiary];
        claims[_beneficiary] = 0;

        return amount;
    }

    /**
     *  @notice Internal function mintInternal.
     *
     *  @dev Mint new utility token by adding a claim
     *       for the beneficiary.
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
        claims[_beneficiary] = claims[_beneficiary].add(_amount);

        emit Minted(tokenUuid, _beneficiary, _amount, claims[_beneficiary], totalTokenSupply);

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

        emit Burnt(tokenUuid, _burner, _amount, totalTokenSupply);

        return true;
    }
}