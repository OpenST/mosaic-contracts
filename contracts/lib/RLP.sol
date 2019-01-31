pragma solidity ^0.5.0;

/**
* @title RLPReader
*
* RLPReader is used to read and parse RLP encoded data in memory.
*
* @author Andreas Olofsson (androlo1980@gmail.com)
*/
library RLP {

    /** Constants */
    uint constant DATA_SHORT_START = 0x80;
    uint constant DATA_LONG_START = 0xB8;
    uint constant LIST_SHORT_START = 0xC0;
    uint constant LIST_LONG_START = 0xF8;

    uint constant DATA_LONG_OFFSET = 0xB7;
    uint constant LIST_LONG_OFFSET = 0xF7;

    /** Storage */
    struct RLPItem {
        uint _unsafe_memPtr;    // Pointer to the RLP-encoded bytes.
        uint _unsafe_length;    // Number of bytes. This is the full length of the string.
    }

    struct Iterator {
        RLPItem _unsafe_item;   // Item that's being iterated over.
        uint _unsafe_nextPtr;   // Position of the next item in the list.
    }

    /* Internal Functions */

    /** Iterator */

    function next(
        Iterator memory self
    )
        internal
        pure
        returns (RLPItem memory subItem_)
    {
        require(hasNext(self));
        uint ptr = self._unsafe_nextPtr;
        uint itemLength = _itemLength(ptr);
        subItem_._unsafe_memPtr = ptr;
        subItem_._unsafe_length = itemLength;
        self._unsafe_nextPtr = ptr + itemLength;
    }

    function next(
        Iterator memory self,
        bool strict
    )
        internal
        pure
        returns (RLPItem memory subItem_)
    {
        subItem_ = next(self);
        require(!(strict && !_validate(subItem_)));
    }

    function hasNext(Iterator memory self) internal pure returns (bool) {
        RLPItem memory item = self._unsafe_item;
        return self._unsafe_nextPtr < item._unsafe_memPtr + item._unsafe_length;
    }

    /** RLPItem */

    /**
    *  @dev Creates an RLPItem from an array of RLP encoded bytes.
    *
    *  @param self The RLP encoded bytes.
    *
    *  @return An RLPItem.
    */
    function toRLPItem(
        bytes memory self
    )
        internal
        pure
        returns (RLPItem memory)
    {
        uint len = self.length;
        if (len == 0) {
            return RLPItem(0, 0);
        }
        uint memPtr;

        /* solium-disable-next-line */
        assembly {
            memPtr := add(self, 0x20)
        }

        return RLPItem(memPtr, len);
    }

    /**
    *  @dev Creates an RLPItem from an array of RLP encoded bytes.
    *
    *  @param self The RLP encoded bytes.
    *  @param strict Will throw if the data is not RLP encoded.
    *
    *  @return An RLPItem.
    */
    function toRLPItem(
        bytes memory self,
        bool strict
    )
        internal
        pure
        returns (RLPItem memory)
    {
        RLPItem memory item = toRLPItem(self);
        if(strict) {
            uint len = self.length;
            require(_payloadOffset(item) <= len);
            require(_itemLength(item._unsafe_memPtr) == len);
            require(_validate(item));
        }
        return item;
    }

    /**
    *  @dev Check if the RLP item is null.
    *
    *  @param self The RLP item.
    *
    *  @return 'true' if the item is null.
    */
    function isNull(RLPItem memory self) internal pure returns (bool ret) {
        return self._unsafe_length == 0;
    }

    /**
    *  @dev Check if the RLP item is a list.
    *
    *  @param self The RLP item.
    *
    *  @return 'true' if the item is a list.
    */
    function isList(RLPItem memory self) internal pure returns (bool ret) {
        if (self._unsafe_length == 0) {
            return false;
        }
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            ret := iszero(lt(byte(0, mload(memPtr)), 0xC0))
        }
    }

    /**
    *  @dev Check if the RLP item is data.
    *
    *  @param self The RLP item.
    *
    *  @return 'true' if the item is data.
    */
    function isData(RLPItem memory self) internal pure returns (bool ret) {
        if (self._unsafe_length == 0) {
            return false;
        }
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            ret := lt(byte(0, mload(memPtr)), 0xC0)
        }
    }

    /**
    *  @dev Check if the RLP item is empty (string or list).
    *
    *  @param self The RLP item.
    *
    *  @return 'true' if the item is null.
    */
    function isEmpty(RLPItem memory self) internal pure returns (bool ret) {
        if(isNull(self)) {
            return false;
        }
        uint b0;
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(memPtr))
        }
        return (b0 == DATA_SHORT_START || b0 == LIST_SHORT_START);
    }

    /**
    *  @dev Get the number of items in an RLP encoded list.
    *
    *  @param self The RLP item.
    *
    *  @return The number of items.
    */
    function items(RLPItem memory self) internal pure returns (uint) {
        if (!isList(self)) {
            return 0;
        }
        uint b0;
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(memPtr))
        }
        uint pos = memPtr + _payloadOffset(self);
        uint last = memPtr + self._unsafe_length - 1;
        uint itms;
        while(pos <= last) {
            pos += _itemLength(pos);
            itms++;
        }
        return itms;
    }

    /**
    *  @dev Create an iterator.
    *
    *  @param self The RLP item.
    *
    *  @return An 'Iterator' over the item.
    */
    function iterator(
        RLPItem memory self
    )
        internal
        pure
        returns (Iterator memory it_)
    {
        require (isList(self));
        uint ptr = self._unsafe_memPtr + _payloadOffset(self);
        it_._unsafe_item = self;
        it_._unsafe_nextPtr = ptr;
    }

    /**
    *  @dev Return the RLP encoded bytes.
    *
    *  @param self The RLPItem.
    *
    *  @return The bytes.
    */
    function toBytes(
        RLPItem memory self
    )
        internal
        pure
        returns (bytes memory bts_)
    {
        uint len = self._unsafe_length;
        if (len == 0) {
            return bts_;
        }
        bts_ = new bytes(len);
        _copyToBytes(self._unsafe_memPtr, bts_, len);
    }

    /**
    *  @dev Decode an RLPItem into bytes. This will not work if the RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toData(
        RLPItem memory self
    )
        internal
        pure
        returns (bytes memory bts_)
    {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        bts_ = new bytes(len);
        _copyToBytes(rStartPos, bts_, len);
    }

    /**
    *  @dev Get the list of sub-items from an RLP encoded list.
    *       Warning: This is inefficient, as it requires that the list is read twice.
    *
    *  @param self The RLP item.
    *
    *  @return Array of RLPItems.
    */
    function toList(
        RLPItem memory self
    )
        internal
        pure
        returns (RLPItem[] memory list_)
    {
        require(isList(self));
        uint numItems = items(self);
        list_ = new RLPItem[](numItems);
        Iterator memory it = iterator(self);
        uint idx = 0;
        while(hasNext(it)) {
            list_[idx] = next(it);
            idx++;
        }
    }

    /**
    *  @dev Decode an RLPItem into an ascii string. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toAscii(
        RLPItem memory self
    )
        internal
        pure
        returns (string memory str_)
    {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        bytes memory bts = new bytes(len);
        _copyToBytes(rStartPos, bts, len);
        str_ = string(bts);
    }

    /**
    *  @dev Decode an RLPItem into a uint. This will not work if the
    *  RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toUint(RLPItem memory self) internal pure returns (uint data_) {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        if (len > 32 || len == 0) {
            revert();
        }

        /* solium-disable-next-line */
        assembly {
            data_ := div(mload(rStartPos), exp(256, sub(32, len)))
        }
    }

    /**
    *  @dev Decode an RLPItem into a boolean. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toBool(RLPItem memory self) internal pure returns (bool data) {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        require(len == 1);
        uint temp;

        /* solium-disable-next-line */
        assembly {
            temp := byte(0, mload(rStartPos))
        }
        require (temp <= 1);

        return temp == 1 ? true : false;
    }

    /**
    *  @dev Decode an RLPItem into a byte. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toByte(RLPItem memory self) internal pure returns (byte data) {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        require(len == 1);
        uint temp;

        /* solium-disable-next-line */
        assembly {
            temp := byte(0, mload(rStartPos))
        }

        return byte(uint8(temp));
    }

    /**
    *  @dev Decode an RLPItem into an int. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toInt(RLPItem memory self) internal pure returns (int data) {
        return int(toUint(self));
    }

    /**
    *  @dev Decode an RLPItem into a bytes32. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toBytes32(
        RLPItem memory self
    )
        internal
        pure
        returns (bytes32 data)
    {
        return bytes32(toUint(self));
    }

    /**
    *  @dev Decode an RLPItem into an address. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return The decoded string.
    */
    function toAddress(
        RLPItem memory self
    )
        internal
        pure
        returns (address data)
    {
        require(isData(self));
        uint rStartPos;
        uint len;
        (rStartPos, len) = _decode(self);
        require (len == 20);

        /* solium-disable-next-line */
        assembly {
            data := div(mload(rStartPos), exp(256, 12))
        }
    }

    /**
    *  @dev Decode an RLPItem into an address. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return Get the payload offset.
    */
    function _payloadOffset(RLPItem memory self) private pure returns (uint) {
        if(self._unsafe_length == 0)
            return 0;
        uint b0;
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(memPtr))
        }
        if(b0 < DATA_SHORT_START)
            return 0;
        if(b0 < DATA_LONG_START || (b0 >= LIST_SHORT_START && b0 < LIST_LONG_START))
            return 1;
        if(b0 < LIST_SHORT_START)
            return b0 - DATA_LONG_OFFSET + 1;
        return b0 - LIST_LONG_OFFSET + 1;
    }

    /**
    *  @dev Decode an RLPItem into an address. This will not work if the
    *       RLPItem is a list.
    *
    *  @param memPtr Memory pointer.
    *
    *  @return Get the full length of an RLP item.
    */
    function _itemLength(uint memPtr) private pure returns (uint len) {
        uint b0;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(memPtr))
        }
        if (b0 < DATA_SHORT_START) {
            len = 1;
        } else if (b0 < DATA_LONG_START) {
            len = b0 - DATA_SHORT_START + 1;
        } else if (b0 < LIST_SHORT_START) {
            /* solium-disable-next-line */
            assembly {
                let bLen := sub(b0, 0xB7) // bytes length (DATA_LONG_OFFSET)
                let dLen := div(mload(add(memPtr, 1)), exp(256, sub(32, bLen))) // data length
                len := add(1, add(bLen, dLen)) // total length
            }
        } else if (b0 < LIST_LONG_START) {
            len = b0 - LIST_SHORT_START + 1;
        } else {
            /* solium-disable-next-line */
            assembly {
                let bLen := sub(b0, 0xF7) // bytes length (LIST_LONG_OFFSET)
                let dLen := div(mload(add(memPtr, 1)), exp(256, sub(32, bLen))) // data length
                len := add(1, add(bLen, dLen)) // total length
            }
        }
    }

    /**
    *  @dev Decode an RLPItem into an address. This will not work if the
    *       RLPItem is a list.
    *
    *  @param self The RLPItem.
    *
    *  @return Get the full length of an RLP item.
    */
    function _decode(
        RLPItem memory self
    )
        private
        pure
        returns (uint memPtr_, uint len_)
    {
        require(isData(self));
        uint b0;
        uint start = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(start))
        }
        if (b0 < DATA_SHORT_START) {
            memPtr_ = start;
            len_ = 1;

            return (memPtr_, len_);
        }
        if (b0 < DATA_LONG_START) {
            len_ = self._unsafe_length - 1;
            memPtr_ = start + 1;
        } else {
            uint bLen;

            /* solium-disable-next-line */
            assembly {
                bLen := sub(b0, 0xB7) // DATA_LONG_OFFSET
            }
            len_ = self._unsafe_length - 1 - bLen;
            memPtr_ = start + bLen + 1;
        }
    }

    /**
    *  @dev Assumes that enough memory has been allocated to store in target.
    *       Gets the full length of an RLP item.
    *
    *  @param btsPtr Bytes pointer.
    *  @param tgt Last item to be allocated.
    *  @param btsLen Bytes length.
    */
    function _copyToBytes(
        uint btsPtr,
        bytes memory tgt,
        uint btsLen
    )
        private
        pure
    {
        // Exploiting the fact that 'tgt' was the last thing to be allocated,
        // we can write entire words, and just overwrite any excess.
        /* solium-disable-next-line */
        assembly {
                let i := 0 // Start at arr + 0x20
                let stopOffset := add(btsLen, 31)
                let rOffset := btsPtr
                let wOffset := add(tgt, 32)
                for {} lt(i, stopOffset) { i := add(i, 32) }
                {
                    mstore(add(wOffset, i), mload(add(rOffset, i)))
                }
        }
    }

    /**
    *  @dev Check that an RLP item is valid.
    *
    *  @param self The RLPItem.
    */
    function _validate(RLPItem memory self) private pure returns (bool ret) {
        // Check that RLP is well-formed.
        uint b0;
        uint b1;
        uint memPtr = self._unsafe_memPtr;

        /* solium-disable-next-line */
        assembly {
            b0 := byte(0, mload(memPtr))
            b1 := byte(1, mload(memPtr))
        }
        if(b0 == DATA_SHORT_START + 1 && b1 < DATA_SHORT_START)
            return false;
        return true;
    }
}
