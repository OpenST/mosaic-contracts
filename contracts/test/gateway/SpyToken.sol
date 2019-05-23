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
 * @title A test double taken where you can check sent values.
 *
 * @notice Use this spy if you need to investigate which values were sent to
 *         the token.
 */
contract SpyToken {
    address public approveFrom;
    address public approveTo;
    uint256 public approveAmount;

    address public transferAddress;
    address public toAddress;
    uint256 public transferAmount;

    bool transferFakeResponse = true;

    bool transferFromFakeResponse = true;

    function setTransferFakeResponse(bool status) public {
        transferFakeResponse = status;
    }

    function setTransferFromFakeResponse(bool status) public {
        transferFromFakeResponse = status;
    }

    function approve(address _to, uint256 _amount) external returns (bool success_) {
        approveFrom = msg.sender;
        approveTo = _to;
        approveAmount = _amount;

        success_ = true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool success_) {
        if(transferFromFakeResponse) {
            transferAddress = _from;
            toAddress = _to;
            transferAmount = _amount;

            success_ = true;
        }
    }

    function transfer(address _to, uint256 _amount) external returns (bool success_) {
        if(transferFakeResponse) {
            toAddress = _to;
            transferAmount = _amount;

            success_ = true;

        }
    }
}