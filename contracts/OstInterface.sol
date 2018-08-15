pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
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

/** @title An interface to an OST ERC-20 token. */
interface OstInterface {

    /**
     * @return The number of decimals that this ERC-20 token has.
     */
    function decimals()
        external
        view
        returns (uint8);

    /**
     * @notice Transfers the given amount of tokens to the given recipient.
     *
     * @param _to The recipient of the tokens.
     * @param _value The amount of tokens to transfer.
     *
     * @return success Indicates whether the transfer was successful.
     */
    function transfer(
        address _to,
        uint256 _value
    )
        external
        returns (bool success);

    /**
     * @notice Transfers the given amount of tokens from the given sender to
     *         the given recipient.
     *
     * @param _from The sender of the tokens.
     * @param _to The recipient of the tokens.
     * @param _value The amount of tokens to transfer.
     *
     * @return success Indicates whether the transfer was successful.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        external
        returns (bool success);

    /**
     * @notice Burns the given amount of tokens and removes them from the total
     *         supply.
     *
     * @param _value The amount of tokens to burn.
     *
     * @return success Indicates whether the burn was successful.
     */
    function burn(
        uint256 _value
    )
        external
        returns (bool success);
}
