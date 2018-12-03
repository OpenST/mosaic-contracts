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
// Auxiliary chain: UtilityTokenInterface
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

    /** Minted raised when new utility tokens are minted for a beneficiary */
    event Minted(
        address indexed _beneficiary,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /** Burnt raised when new utility tokens are burnt for an address */
    event Burnt(
        address indexed _account,
        uint256 _amount,
        uint256 _totalSupply,
        address _utilityToken
    );

    /* Public Functions */

    /**
     * @notice Mints the utility token
     *
     * @dev Adds _amount tokens to beneficiary balance and increases the
     *      totalTokenSupply. Can be called only by CoGateway.
     *
     * @param _beneficiary Address of tokens beneficiary.
     * @param _amount Amount of tokens to mint.
     *
     * @return bool `true` if mint is successful, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        returns (bool success);

    /**
     * @notice Burns the balance for the burner's address
     *
     * @dev only burns the amount from CoGateway address, So to burn
     *      transfer the amount to CoGateway.
     *
     * @param _burner Burner address.
     * @param _amount Amount of tokens to burn.
     *
     * @return bool `true` if burn is successful, false otherwise.
     */
    function burn(
        address _burner,
        uint256 _amount
    )
        external
        returns (bool success);
}
