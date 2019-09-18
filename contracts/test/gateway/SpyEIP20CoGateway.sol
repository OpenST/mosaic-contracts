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

import "./SpyToken.sol";

/**
 * @title A test double co-gateway where you can check sent values.
 *
 * @notice Use this spy if you need to investigate which values were sent to
 *         the co-gateway.
 */
contract SpyEIP20CoGateway {

    SpyToken public utilityToken;
    uint256 public expectedNonce = 1;
    uint256 public bounty = 100;
    uint256 public amount;
    address public beneficiary;
    uint256 public gasPrice;
    uint256 public gasLimit;
    uint256 public nonce;
    bytes32 public hashLock;

    constructor() public {
        utilityToken = new SpyToken();
    }

    /**
     *  This method is used for testing. It returns fix nonce.
     */
    function getNonce(address) external view returns(uint256) {
        return expectedNonce;
    }

    /**
     * @notice Used for testing of redeem feature. This method spy on co-gateway redeem.
     *
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
     * @return messageHash_ Hash of message.
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
        returns(bytes32)
    {
        amount = _amount;
        beneficiary = _beneficiary;
        gasPrice = _gasPrice;
        gasLimit = _gasLimit;
        nonce = _nonce;
        hashLock = _hashLock;
        return bytes32('1');
    }
}
