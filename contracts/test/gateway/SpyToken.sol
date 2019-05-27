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

    address public fromAddress;
    address public toAddress;
    uint256 public transferAmount;

    /**
     * It helps in emulating transfer method of EIP20Token. If true then
     * it emulates positive case otherwise negative.
     */
    bool transferFakeResponse = true;

    /**
     * It helps in emulating transferFrom method of EIP20Token. If true then
     * it emulates positive case otherwise negative.
     */
    bool transferFromFakeResponse = true;

    /**
     * @notice It is used to set the value of transferFakeResponse.
     *
     * @param status Boolean value to be set.
     */
    function setTransferFakeResponse(bool status) public {
        transferFakeResponse = status;
    }

    /**
     * @notice It is used to set the value of transferFromFakeResponse.
     *
     * @param status Boolean value to be set.
     */
    function setTransferFromFakeResponse(bool status) public {
        transferFromFakeResponse = status;
    }

    function approve(address _to, uint256 _amount) external returns (bool success_) {
        approveFrom = msg.sender;
        approveTo = _to;
        approveAmount = _amount;

        success_ = true;
    }

    /**
     * @notice It is used to test EIP20Token passing and failure cases.
     *         If `transferFromFakeResponse` is set to false then failure case
     *         is being tested.
     *
     * @param _from Address of the account from where tokens will be transferred.
     * @param _to Receiver of the tokens.
     * @param _amount Number of tokens to be transferred.
     *
     * @return bool `true` if `transferFromFakeResponse` is True otherwise false.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    )
        external
        returns (bool success_)
    {
        fromAddress = _from;
        toAddress = _to;
        transferAmount = _amount;
        success_ = transferFromFakeResponse;
    }

    /**
     * @notice It is used to test EIP20Token passing and failure cases.
     *         If `transferFromFakeResponse` is set to false then failure case
     *         is being tested.
     *
     * @param _to Receiver of the tokens.
     * @param _amount Number of tokens to be transferred.
     *
     * @return bool `true` if `transferFromFakeResponse` is True otherwise false.
     */
    function transfer(
        address _to,
        uint256 _amount
    )
        external
        returns (bool success_)
    {
        toAddress = _to;
        transferAmount = _amount;
        success_ = transferFakeResponse;
    }
}
