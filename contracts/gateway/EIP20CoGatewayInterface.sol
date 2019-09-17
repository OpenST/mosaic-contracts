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


interface EIP20CoGatewayInterface {

    /**
     * @notice Initiates the redeem process.
     *
     * @dev In order to redeem the redeemer needs to approve CoGateway contract
     *      for redeem amount. Redeem amount is transferred from redeemer
     *      address to CoGateway contract.
     *      This is a payable function. The bounty is transferred in base coin.
     *      Redeemer is always msg.sender.
     *
     * @param _amount Redeem amount that will be transferred from redeemer
     *                account.
     * @param _beneficiary The address in the origin chain where the value
     *                     tok ens will be released.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the
     *                  redeem process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Nonce of the redeemer address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Unique for each request.
     */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        payable
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
     * @notice Get the utilityToken token of this cogateway.
     *
     * @return The address of the utilitytoken.
     */
    function utilityToken() external view returns (EIP20Interface);

}
