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

// utility chain contracts
import "./UtilityTokenInterface.sol";


/// @title UtilityToken abstract
contract UtilityTokenAbstract is Hasher, ProtocolVersioned, UtilityTokenInterface {
    using SafeMath for uint256;
    
    /*
     *  Events
     */
    /// Minted raised when new utility tokens are minted for a beneficiary
    /// Minted utility tokens still need to be claimed by anyone to transfer
    /// them to the beneficiary.
    event Minted(bytes32 indexed _uuid, address indexed _beneficiary,
        uint256 _amount, uint256 _unclaimed, uint256 _totalSupply);

    event Burnt(bytes32 indexed _uuid, address indexed _account,
        uint256 _amount, uint256 _totalSupply);
    
    /*
     *  Storage
     */
    /// UUID for the utility token
    bytes32 private tokenUuid;
    /// totalSupply holds the total supply of utility tokens
    uint256 private totalTokenSupply;
    /// conversion rate for the utility token
    uint256 private tokenConversionRate;
    /// conversion rate decimal factor
    uint8 private tokenConversionRateDecimals;
    /// tokenChainIdValue is an invariant in the tokenUuid calculation    
    uint256 private tokenChainIdValue;
    /// tokenChainIdUtility is an invariant in the tokenUuid calculation
    uint256 private tokenChainIdUtility;
    /// tokenOpenSTUtility is an invariant in the tokenUuid calculation
    address private tokenOpenSTUtility;
    /// claims is follows EIP20 allowance pattern but
    /// for a staker to stake the utility token for a beneficiary
    mapping(address => uint256) private claims;

    /*
     * Public functions
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

    /// @dev Get totalTokenSupply as view so that child cannot edit
    function totalSupply()
        public
        view
        returns (uint256 /* supply */)
    {
        return totalTokenSupply;
    }

    /// @dev Get tokenUuid as view so that child cannot edit
    function uuid()
        public
        view
        returns (bytes32 /* uuid */)
    {
        return tokenUuid;
    }

    /// @dev Get tokenConversionRate as view so that child cannot edit
    function conversionRate()
        public
        view
        returns (uint256 /* rate */)
    {
        return tokenConversionRate;
    }

    /// @dev Get conversion rate decimal factor for utility token
    function conversionRateDecimals() 
        public 
        view 
        returns (uint8 /*conversionRateDecimals*/)
    {
        return tokenConversionRateDecimals;
    }

    /// @dev Get tokenChainIdValue as view so that child cannot edit
    function genesisChainIdValue()
        public
        view
        returns (uint256 /* tokenChainIdValue */)
    {
        return tokenChainIdValue;
    }

    /// @dev Get tokenChainIdUtility as view so that child cannot edit
    function genesisChainIdUtility()
        public
        view
        returns (uint256 /* tokenChainIdUtility */)
    {
        return tokenChainIdUtility;
    }

    /// @dev Get tokenOpenSTUtility as view so that child cannot edit
    function genesisOpenSTUtility()
        public
        view
        returns (address /* tokenOpenSTUtility */)
    {
        return tokenOpenSTUtility;
    }

    /// @dev returns unclaimed amount for beneficiary
    function unclaimed(
        address _beneficiary)
        public
        view
        returns (uint256 /* amount */)
    {
        return claims[_beneficiary];
    }

    /*
     * Internal functions
     */
    /// @dev claim transfers all utility tokens to _beneficiary
    function claimInternal(
        address _beneficiary)
        internal
        returns (uint256 amount)
    {
        amount = claims[_beneficiary];
        claims[_beneficiary] = 0;

        return amount;
    }

    /// @dev Mint new utility token by adding a claim
    ///      for the beneficiary
    function mintInternal(
        address _beneficiary,
        uint256 _amount)
        internal
        returns (bool /* success */)
    {
        totalTokenSupply = totalTokenSupply.add(_amount);
        claims[_beneficiary] = claims[_beneficiary].add(_amount);

        emit Minted(tokenUuid, _beneficiary, _amount, claims[_beneficiary], totalTokenSupply);

        return true;
    }

    /// @dev Burn utility tokens after having redeemed them
    ///      through the protocol for the staked Simple Token
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