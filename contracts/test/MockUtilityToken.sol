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
// Auxiliary chain: MockUtilityToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract MockUtilityToken {

    /* Storage */

    /**
     * Address to which the utility tokens will be transferred after minting.
     */
    address public beneficiary;

    /* Amount received by beneficiary.  */
    uint256 public amount;


    /* External functions */

    /**
     * @notice Mints the utility token
     *
     * @dev Adds _amount tokens to beneficiary balance and increases the
     *      totalTokenSupply. Can be called only by CoGateway.
     *
     * @param _beneficiary Address of tokens beneficiary.
     * @param _amount Amount of tokens to mint.
     *
     * @return True if mint is successful, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        returns (bool /* success */)
    {
        beneficiary = _beneficiary;
        amount = _amount;
        return true;
    }
}
