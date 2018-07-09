pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// SafeMath Library Implementation
//
// Copyright (c) 2017 OpenST Ltd.
// https://simpletoken.org/
//
// The MIT Licence.
//
// Based on the SafeMath library by the OpenZeppelin team.
// Copyright (c) 2016 Smart Contract Solutions, Inc.
// https://github.com/OpenZeppelin/zeppelin-solidity
// The MIT License.
// ----------------------------------------------------------------------------

/**
 *  @title Safemath library
 *
 *  @notice Based on the SafeMath library by the OpenZeppelin team.
 */
library SafeMath {

    /**
     *  @notice internal pure function mul
     * 
     *  @param a unsigned integer multiplicand
     *  @param b unsigned integer multiplier
     *
     *  @return uint256 product
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a * b;

        assert(a == 0 || c / a == b);

        return c;
    }

    /**
     *  @notice internal pure function div
     * 
     *  @param a unsigned integer dividend
     *  @param b unsigned integer divisor
     *
     *  @return uint256 quotient
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity automatically throws when dividing by 0 
        uint256 c = a / b;

        // assert(a == b * c + a % b); There is no case in which this doesn't hold
        return c;
    }

    /**
     *  @notice internal pure function sub
     * 
     *  @param a unsigned integer minuend
     *  @param b unsigned integer subtrahend 
     *
     *  @return uint256 difference
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);

        return a - b;
    }

    /**
     *  @notice internal pure function add
     * 
     *  @param a unsigned integer augend
     *  @param b unsigned integer addend
     *
     *  @return uint256 sum
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;

        assert(c >= a);

        return c;
    }
}
