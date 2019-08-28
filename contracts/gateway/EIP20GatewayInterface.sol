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

import "../lib/EIP20Interface.sol";


interface EIP20GatewayInterface {

    /**
     * @notice Initiates the stake process. In order to stake the staker
     *         needs to approve Gateway contract for stake amount.
     *         Staked amount is transferred from staker address to
     *         Gateway contract. Bounty amount is also transferred from staker.
     *
     * @param _amount Stake amount that will be transferred from the staker
     *                account.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Nonce of the staker address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Message hash is unique for each request.
     */
    function stake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        returns (bytes32 messageHash_);

    /**
     * @notice Get the nonce for the given account address.
     *
     * @param _account Account address for which the nonce is to be fetched.
     *
     * @return The nonce.
     */
    function getNonce(address _account)
        external
        view
        returns (uint256);

    /**
     * @notice Amount of EIP20 which is staked by facilitator.
     *
     * @return The amount.
     */
    function bounty() external view returns (uint256);

    /**
     * @notice Get the value token of this gateway.
     *
     * @return The address of the value token.
     */
    function token() external view returns (EIP20Interface);

    /**
     * @notice Get the base token of this gateway.
     *
     * @return The address of the base token.
     */
    function baseToken() external view returns (EIP20Interface);
}
