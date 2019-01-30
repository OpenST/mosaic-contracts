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

import "../gateway/EIP20Token.sol";

/**
 * @title EIP20StandardToken is a standard implementation of an ERC20 token.
 *
 * @notice It is required for integration tests.
 */
contract EIP20StandardToken is EIP20Token {

    /* Constructor */

    /**
     * @notice The initial supply will be transferred to msg.sender.
     *
     * @param _symbol Symbol of the token.
     * @param _name Name of the token.
     * @param _totalSupply Total supply of the tokens at creation. Without
     *                     decimals.
     * @param _decimals Decimal places of the token.
     */
    constructor(
        string memory _symbol,
        string memory _name,
        uint256 _totalSupply,
        uint8 _decimals
    )
        public
        EIP20Token(
            _symbol,
            _name,
            _decimals
        )
    {
        totalTokenSupply = _totalSupply * 10**uint256(_decimals);
        balances[msg.sender] = totalTokenSupply;

        emit Transfer(address(0), msg.sender, totalTokenSupply);
    }
}
