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
// Utility chain: BrandedToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";

// utility chain contracts
import "./EIP20Token.sol";
import "./UtilityTokenAbstract.sol";


/// @dev  Branded Token is an EIP20 token minted by staking Simple Token
///       on Ethereum mainnet. Branded tokens are designed to be used
///       within a (decentralised) application and support:
///        - smart contract controlled password reset for users who don't
///          yet (hard-spoon FTW) manage their own private keys (+v0.9.2)
///        - soft-exit for a user to redeem their equivalent part of the 
///          Simple Token stake on Ethereum mainnet
///        - hard-exit for all users if the utility chain halts to reclaim
///          their equivalent part of the Simple Token stake
///          on Ethereum (before v1.0)
contract BrandedToken is EIP20Token, UtilityTokenAbstract {
    using SafeMath for uint256;

    /*
     *  Public functions
     */
    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint8 _decimals,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        EIP20Token(_symbol, _name, _decimals)
        UtilityTokenAbstract(
        _uuid,
        _symbol,
        _name,
        _chainIdValue,
        _chainIdUtility,
        _conversionRate,
        _conversionRateDecimals)
        { }

    function claim(
        address _beneficiary)
        public
        returns (bool /* success */)
    {
        uint256 amount = claimInternal(_beneficiary);

        return claimEIP20(_beneficiary, amount);
    }

    function mint(
        address _beneficiary,
        uint256 _amount)
        public
        onlyProtocol
        returns (bool /* success */)
    {
        mintEIP20(_amount);

        return mintInternal(_beneficiary, _amount);
    }

    function burn(
        address _burner,
        uint256 _amount)
        public
        onlyProtocol
        payable
        returns (bool /* success */)
    {
        // force non-payable, as only ST' handles in base tokens
        require(msg.value == 0);

        burnEIP20(_amount);

        return burnInternal(_burner, _amount);
    }
}