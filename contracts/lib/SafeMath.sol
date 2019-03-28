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
// Based on the SafeMath library by the OpenZeppelin team.
// Copyright (c) 2018 Smart Contract Solutions, Inc.
// https://github.com/OpenZeppelin/zeppelin-solidity
// The MIT License.
// ----------------------------------------------------------------------------


/**
 * @title SafeMath library.
 *
 * @notice Based on the SafeMath library by the OpenZeppelin team.
 *
 * @dev Math operations with safety checks that revert on error.
 */
library SafeMath {

    /* Internal Functions */

    /**
     * @notice Multiplies two numbers, reverts on overflow.
     *
     * @param a Unsigned integer multiplicand.
     * @param b Unsigned integer multiplier.
     *
     * @return uint256 Product.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        /*
         * Gas optimization: this is cheaper than requiring 'a' not being zero,
         * but the benefit is lost if 'b' is also tested.
         * See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
         */
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(
            c / a == b,
            "Overflow when multiplying."
        );

        return c;
    }

    /**
     * @notice Integer division of two numbers truncating the quotient, reverts
     *         on division by zero.
     *
     * @param a Unsigned integer dividend.
     * @param b Unsigned integer divisor.
     *
     * @return uint256 Quotient.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0.
        require(
            b > 0,
            "Cannot do attempted division by less than or equal to zero."
        );
        uint256 c = a / b;

        // There is no case in which the following doesn't hold:
        // assert(a == b * c + a % b);

        return c;
    }

    /**
     * @notice Subtracts two numbers, reverts on underflow (i.e. if subtrahend
     *         is greater than minuend).
     *
     * @param a Unsigned integer minuend.
     * @param b Unsigned integer subtrahend.
     *
     * @return uint256 Difference.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(
            b <= a,
            "Underflow when subtracting."
        );
        uint256 c = a - b;

        return c;
    }

    /**
     * @notice Adds two numbers, reverts on overflow.
     *
     * @param a Unsigned integer augend.
     * @param b Unsigned integer addend.
     *
     * @return uint256 Sum.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(
            c >= a,
            "Overflow when adding."
        );

        return c;
    }

    /**
     * @notice Divides two numbers and returns the remainder (unsigned integer
     *         modulo), reverts when dividing by zero.
     *
     * @param a Unsigned integer dividend.
     * @param b Unsigned integer divisor.
     *
     * @return uint256 Remainder.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(
            b != 0,
            "Cannot do attempted division by zero (in `mod()`)."
        );

        return a % b;
    }
}
