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

import "../../gateway/UtilityToken.sol";

/**
 * @title MockEIP20Token contract
 *
 * @notice This contract is used to mock certain functions of MockEIP20Token
 *         contract.
 */
contract MockEIP20Token is EIP20Token {

    uint8   public constant TOKEN_DECIMALS = 18;
    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKENS_MAX     = 800000000 * DECIMALSFACTOR;


    /* Constructor */

    /** @notice Contract constructor. */
    constructor()
        public
        EIP20Token("", "", TOKEN_DECIMALS)
    {
        totalTokenSupply = TOKENS_MAX;
        balances[msg.sender] = TOKENS_MAX;
    }

}
