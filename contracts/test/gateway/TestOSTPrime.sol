/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.5.0;

// Copyright 2018 OpenST Ltd.
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

/// Simple Token Prime [OST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the auxiliary
/// chain. The gasprice on auxiliary chains is set in [OST'-Wei/gas] (like
/// Ether pays for gas on Ethereum mainnet) when sending a transaction on
/// the auxiliary chain.

import "../../gateway/OSTPrime.sol";

/**
 *  @title Test OST prime contract.
 */
contract TestOSTPrime is OSTPrime {


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @dev This contract is used only for testing.
     *
     * @param _valueToken ERC20 token address in origin chain.
     */
    constructor(address _valueToken)
        public
        OSTPrime(_valueToken)
    {

    }


    /* Public functions. */

    /**
     * @notice Set the EIP-20 token balance for the given account address.
     *
     * @dev This is used only for testing.
     *
     * @param _account Address for which the balance is to be set.
     * @param _amount The amount of tokens to be set.
     */
    function setTokenBalance(
        address _account,
        uint256 _amount
    )
        public
    {
        balances[_account] = _amount;
    }

}
