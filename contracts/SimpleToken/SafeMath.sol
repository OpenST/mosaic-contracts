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
 *  @title Safemath library.
 *
 *  @notice Based on the SafeMath library by the OpenZeppelin team.
 */
library SafeMath {

    /** Internal Functions */

    /**
     *  @notice Internal pure function mul.
     *
     *  @param a Unsigned integer multiplicand.
     *  @param b Unsigned integer multiplier.
     *
     *  @return uint256 Product.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a * b;

        assert(a == 0 || c / a == b);

        return c;
    }

    /**
     *  @notice Internal pure function div.
     *
     *  @param a Unsigned integer dividend.
     *  @param b Unsigned integer divisor.
     *
     *  @return uint256 Quotient.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity automatically throws when dividing by 0 
        uint256 c = a / b;

        // assert(a == b * c + a % b); There is no case in which this doesn't hold
        return c;
    }

    /**
     *  @notice Internal pure function sub.
     *
     *  @param a Unsigned integer minuend.
     *  @param b Unsigned integer subtrahend.
     *
     *  @return uint256 Difference.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);

        return a - b;
    }

    /**
     *  @notice Internal pure function add.
     *
     *  @param a Unsigned integer augend.
     *  @param b Unsigned integer addend.
     *
     *  @return uint256 Sum.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;

        assert(c >= a);

        return c;
    }
}
