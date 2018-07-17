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
// Utility chain: STPrimeConfig
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/* solhint-disable-next-line two-lines-top-level-separator */
/**
 *  @title STPrimeConfig contract.
 *
 *  @notice Contains configuration constants utilized by the STPrime contract.
 */
contract STPrimeConfig {

    /** Constants */

    string  public constant STPRIME_SYMBOL          = "STP";
    string  public constant STPRIME_NAME            = "SimpleTokenPrime";
    uint256 public constant STPRIME_CONVERSION_RATE = 1;
    uint8   public constant TOKEN_DECIMALS          = 18;
    uint8   public constant STPRIME_CONVERSION_RATE_TOKEN_DECIMALS = 0;

    /** Storage */

    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKENS_MAX     = 800000000 * DECIMALSFACTOR;
}
