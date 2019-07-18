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
 * @title A test double gateway where you can check sent values.
 *
 * @notice Use this spy if you need to investigate which values were sent to
 *         the gateway.
 */
contract SpyEIP20Gateway {
    uint256 public bounty = 1337;
    uint256 public expectedNonce = 42;
    bytes32 public messageHash = "b";

    SpyToken public token;
    SpyToken public baseToken;

    uint256 public amount;
    address public beneficiary;
    uint256 public gasPrice;
    uint256 public gasLimit;
    uint256 public nonce;
    bytes32 public hashLock;

    constructor() public {
        token = new SpyToken();
        baseToken = new SpyToken();
    }

    function stake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        returns (bytes32 messageHash_)
    {
        amount = _amount;
        beneficiary = _beneficiary;
        gasPrice = _gasPrice;
        gasLimit = _gasLimit;
        nonce = _nonce;
        hashLock = _hashLock;

        messageHash_ = messageHash;
    }

    function getNonce(address) external view returns(uint256) {
        return expectedNonce;
    }
}
