pragma solidity ^0.5.0;

// Library for RLP encoding a list of bytes arrays.
// Modeled after ethereumjs/rlp (https://github.com/ethereumjs/rlp)
// [Very] modified version of Sam Mayo's library.

import "./BytesLib.sol";

library RLPEncode {

    // Encode an item (bytes)
    function encodeItem(
        bytes memory self
    )
        internal
        pure
        returns (bytes memory encoded_)
    {
        if(self.length == 1 && uint(bytes32(self[0])) < 0x80) {
            encoded_ = new bytes(1);
            encoded_ = self;
        } else {
            encoded_ = BytesLib.concat(encodeLength(self.length, 128), self);
        }
    }

    // Encode a list of items
    function encodeList(
        bytes[] memory self
    )
        internal
        pure
        returns (bytes memory encoded_)
    {
        for (uint i = 0; i < self.length; i++) {
            encoded_ = BytesLib.concat(encoded_, encodeItem(self[i]));
        }
        encoded_ = BytesLib.concat(encodeLength(encoded_.length, 192), encoded_);
    }

    // Hack to encode nested lists. If you have a list as an item passed here, included
    // pass = true in that index. E.g.
    // [item, list, item] --> pass = [false, true, false]
    function encodeListWithPasses(
        bytes[] memory self,
        bool[] memory pass
    )
        internal
        pure
        returns (bytes memory encoded_)
    {
        for (uint i = 0; i < self.length; i++) {
            if (pass[i] == true) {
                encoded_ = BytesLib.concat(encoded_, self[i]);
            } else {
                encoded_ = BytesLib.concat(encoded_, encodeItem(self[i]));
            }
        }
        encoded_ = BytesLib.concat(encodeLength(encoded_.length, 192), encoded_);
    }

    // Generate the prefix for an item or the entire list based on RLP spec
    function encodeLength(
        uint256 L,
        uint256 offset
    )
        internal
        pure
        returns (bytes memory prefix_)
    {
        if (L < 56) {
            prefix_ = new bytes(1);
            prefix_[0] = byte(uint8(L + offset));
        } else {
            // lenLen is the length of the hex representation of the data length
            uint lenLen = 0;
            uint i = 0x1;
            while(L/i != 0) {
                lenLen++;
                i *= 0x100;
            }
            bytes memory prefix0 = getLengthBytes(offset + 55 + lenLen);
            bytes memory prefix1 = getLengthBytes(L);
            prefix_ = BytesLib.concat(prefix0, prefix1);
        }
    }

    function getLengthBytes(
        uint256 _length
    )
        internal
        pure
        returns (bytes memory bytes_)
    {
        // Figure out if we need 1 or two bytes to express the length.
        // 1 byte gets us to max 255
        // 2 bytes gets us to max 65535 (no payloads will be larger than this)
        uint256 nBytes = 1;
        if (_length > 255) {
            nBytes = 2;
        }

        bytes_ = new bytes(nBytes);

        // Encode the length and return it
        for (uint i = 0; i < nBytes; i++) {
            bytes_[i] = byte(
                uint8(
                    _length / (2**(8*(nBytes - 1 - i)))
                )
            );
        }
    }
}
