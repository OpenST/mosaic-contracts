pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
// Common: BytesLibTest.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./BytesLib.sol";


/**
 *  @title BytesLibTest contract which implements BytesLib
 *
 *  @notice Allows for testing of functions in the BytesLib Library.
 */
 contract BytesLibTest {


    /**
     * @notice Public pure function slice.
     *
     * @param _bytes Bytes to slice.
     * @param _start Starting index position of bytes.
     * @param _length Index length to slice up to.
     *
     * @return bytes Sliced bytes from _start to _length.
     */
     function slice(
        bytes _bytes,
        uint _start,
        uint _length
    )
        public
        pure
        returns (bytes _out)
    {
        _out = BytesLib.slice(_bytes, _start, _length);
        return _out;
    }

    /**
     * @notice Public pure function toUint.
     *
     * @param _bytes Bytes to convert to uint.
     * @param _start Starting index position of bytes.
     *
     * @return uint256 Bytes converted to uint256.
     */
     function toUint(bytes _bytes, uint _start) public pure returns (uint256 _out) {
        _out = BytesLib.toUint(_bytes, _start);
        return _out;
     }

    /**
     * @notice Public pure function toAddress.
     * 
     * @param _bytes Bytes to convert to address.
     * @param _start Start index position of bytes.
     *
     * @return address Bytes converted to Address.
     */
     function toAddress(bytes _bytes, uint _start) public pure returns (address _add) {
        _add = BytesLib.toAddress(_bytes, _start);
        return _add;
     }
 }