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
// Utility chain: OSTPrimeConfig
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/* solhint-disable-next-line two-lines-top-level-separator */
/**
 *  @title OSTPrimeConfig contract.
 *
 *  @notice Contains configuration constants utilized by the OSTPrime contract.
 */
contract OSTPrimeConfig {

    /** Constants */

    string public constant TOKEN_SYMBOL = "ST";
    string public constant TOKEN_NAME = "Simple Token";
    uint8 public constant TOKEN_DECIMALS = 18;

    /** Storage */

    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKENS_MAX = 800000000 * DECIMALSFACTOR;
}
