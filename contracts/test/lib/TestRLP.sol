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

import "../../lib/RLP.sol";

/**
 *  @title TestRLP contract is for RLP library contract
 *
 *  @notice It is used to test methods in RLP library contract
 */
contract TestRLP  {

    /**
      * @notice Creates an RLPItem from an array of RLP encoded bytes.
      *
      * @param rlpData The RLP encoded bytes.
      *
      * @return memory pointer at which rlp data is present.
      * @return length of the rlp data.
      */
    function toRLPItem(
        bytes memory rlpData
    )
        public
        pure
        returns(uint memoryPointer_, uint length_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpData);
        memoryPointer_ = item._unsafe_memPtr;
        length_ = item._unsafe_length;
    }

    /**
      * @notice Get the list of sub-items from an RLP encoded list.
      * Warning: This is inefficient, as it requires that the list is read twice.
      *
      * @param rlpData The RLP encoded bytes.
      * @param index The position in the input array of which data is returned
      *
      * @return data kept at index.
      * @return length of list.
      */
    function toList(
        bytes memory rlpData,
        uint256 index
    )
        public
        pure
        returns (bytes memory data_, uint256 length_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpData);
        RLP.RLPItem[] memory list = RLP.toList(item);

        length_ = list.length;
        if (index < length_) {
            data_ = RLP.toData(list[index]);
        }
    }

    /**
     *@notice Decode an RLPItem into a bytes32. This will not work if the RLPItem is a list.
     *
     * @param rlpData The RLPItem encoded bytes.
     *
     * @return toBytes decoded value in the from of bytes.
     */
    function toBytes(
        bytes memory rlpData
    )
        public
        pure
        returns(bytes memory bytes_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpData);
        bytes_ = RLP.toBytes(item);
    }

    /**
      * @notice Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
      *
      * @param rlpData The RLPItem encoded bytes.
      *
      * @return toData The decoded string in bytes format.
      */
    function toData(
        bytes memory rlpData
    )
        public
        pure
        returns(bytes memory bytes_)
    {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpData);
        bytes_ = RLP.toData(item);
    }
}
