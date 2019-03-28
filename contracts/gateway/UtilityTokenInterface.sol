/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

/**
 *  @title UtilityTokenInterface contract.
 *
 *  @notice Provides the interface to utility token contract.
 */
contract UtilityTokenInterface {


    /* External functions */

    /**
     * @notice Increases the total token supply.
     *
     * @dev Adds number of tokens to beneficiary balance and increases the
     *      total token supply.
     *
     * @param _account Account address for which the balance will be increased.
     *                 This is payable so that it provides flexibility of
     *                 transferring base token to account on increase supply.
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if increase supply is successful, false otherwise.
     */
    function increaseSupply(
        address payable _account,
        uint256 _amount
    )
        external
        returns (bool success_);

    /**
     * @notice Decreases the token supply.
     *
     * @dev Decreases the token balance from the msg.sender address and
     *      decreases the total token supply count.
     *
     * @param _amount Amount of tokens.
     *
     * @return success_ `true` if decrease supply is successful, false otherwise.
     */
    function decreaseSupply(uint256 _amount) external returns (bool success_);

    /**
     * @notice Sets the CoGateway contract address.
     *
     * @dev Function requires:
     *          - It is called by whitelisted workers.
     *          - coGateway address is set only once.
     *          - coGateway.utilityToken must match this contract.
     *
     * @param _coGateway CoGateway contract address.
     *
     */
    function setCoGateway(address _coGateway) external returns (bool);

    /**
     * @notice  Checks if an address exists.
     *
     * @param _actor Address that needs to be checked
     *
     * @return exists_ `true` if the address is allowed otherwise `false`
     */
    function exists(address _actor) external returns (bool exists_);
}
