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
// Utility chain: UtilityTokenInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title UtilityTokenInterface contract
 *
 *  @notice Provides the interface to utility token contract.
 */
contract UtilityTokenInterface {

    /** Events */

    /**
     *  Minted raised when new utility tokens are minted for a beneficiary
     *  Minted utility tokens still need to be claimed by anyone to transfer
     *  them to the beneficiary.
     */
    event Minted(
        address indexed _beneficiary,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    event Burnt(
        address indexed _account,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /** Public Functions */

    /** @dev Mint new utility token into  claim for beneficiary */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        returns (bool success);

    /** @dev Burn utility tokens */
    function burn(
        address _burner,
        uint256 _amount
    )
        external
        returns (bool success);
}