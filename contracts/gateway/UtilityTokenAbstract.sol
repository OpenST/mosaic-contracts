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
import "./UtilityTokenInterface.sol";

/**
 *  @title UtilityTokenAbstract contract which implements
 *         UtilityTokenInterface.
 *         TODO: Add organisation.
 *
 *  @notice Contains methods for utility tokens.
 */
contract UtilityTokenAbstract is UtilityTokenInterface {
    using SafeMath for uint256;

    /** Storage */

    /** totalSupply holds the total supply of utility tokens */
    uint256 private totalTokenSupply;

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @dev TODO: Sets Organisation with msg.sender address.
     *
     */
    constructor()
        public
        //TODO: add organisation
    {
        totalTokenSupply = 0;
    }

    /**
     *  @notice Public view function totalSupply.
     *
     *  @dev Get totalTokenSupply as view so that child cannot edit.
     *
     *  @return uint256 Total token supply.
     */
    function totalSupply()
        public
        view
        returns (uint256)
    {
        return totalTokenSupply;
    }

    /** Internal functions */

    /**
     *  @notice Internal function mintInternal.
     *
     *  @param _beneficiary Address of the beneficiary.
     *  @param _amount Amount of tokens to mint.
     *
     *  @return bool True if tokens are minted, false otherwise.
     */
    function mintInternal(
        address _beneficiary,
        uint256 _amount
    )
        internal
        returns (bool)
    {
        totalTokenSupply = totalTokenSupply.add(_amount);

        emit Minted(_beneficiary, _amount, totalTokenSupply, address(this));

        return true;
    }

    /**
     *  @notice Internal function burnInternal.
     *
     *  @param _burner Address of the burner of tokens.
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if tokens are burnt, false otherwise.
     */
    function burnInternal(
        address _burner,
        uint256 _amount
    )
        internal
        returns (bool /* success */)
    {
        totalTokenSupply = totalTokenSupply.sub(_amount);

        emit Burnt(_burner, _amount, totalTokenSupply, address(this));

        return true;
    }
}