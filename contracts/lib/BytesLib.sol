pragma solidity ^0.5.0;

library BytesLib {
    function concat(
        bytes memory _preBytes,
        bytes memory _postBytes
    )
        internal
        pure returns (bytes memory bytes_)
    {
        /* solium-disable-next-line */
        assembly {
            // Get a location of some free memory and store it in bytes_ as
            // Solidity does for memory variables.
            bytes_ := mload(0x40)

            // Store the length of the first bytes array at the beginning of
            // the memory for bytes_.
            let length := mload(_preBytes)
            mstore(bytes_, length)

            // Maintain a memory counter for the current write location in the
            // temp bytes array by adding the 32 bytes for the array length to
            // the starting location.
            let mc := add(bytes_, 0x20)
            // Stop copying when the memory counter reaches the length of the
            // first bytes array.
            let end := add(mc, length)

            for {
                // Initialize a copy counter to the start of the _preBytes data,
                // 32 bytes into its memory.
                let cc := add(_preBytes, 0x20)
            } lt(mc, end) {
                // Increase both counters by 32 bytes each iteration.
                mc := add(mc, 0x20)
                cc := add(cc, 0x20)
            } {
                // Write the _preBytes data into the bytes_ memory 32 bytes
                // at a time.
                mstore(mc, mload(cc))
            }

            // Add the length of _postBytes to the current length of bytes_
            // and store it as the new length in the first 32 bytes of the
            // bytes_ memory.
            length := mload(_postBytes)
            mstore(bytes_, add(length, mload(bytes_)))

            // Move the memory counter back from a multiple of 0x20 to the
            // actual end of the _preBytes data.
            mc := end
            // Stop copying when the memory counter reaches the new combined
            // length of the arrays.
            end := add(mc, length)

            for {
                let cc := add(_postBytes, 0x20)
            } lt(mc, end) {
                mc := add(mc, 0x20)
                cc := add(cc, 0x20)
            } {
                mstore(mc, mload(cc))
            }

            // Update the free-memory pointer by padding our last write location
            // to 32 bytes: add 31 bytes to the end of bytes_ to move to the
            // next 32 byte block, then round down to the nearest multiple of
            // 32. If the sum of the length of the two arrays is zero then add
            // one before rounding down to leave a blank 32 bytes (the length block with 0).
            mstore(0x40, and(
              add(add(end, iszero(add(length, mload(_preBytes)))), 31),
              not(31) // Round down to the nearest 32 bytes.
            ))
        }
    }

    // Pad a bytes array to 32 bytes
    function leftPad(
        bytes memory _bytes
    )
        internal
        pure
        returns (bytes memory padded_)
    {
        bytes memory padding = new bytes(32 - _bytes.length);
        padded_ = concat(padding, _bytes);
    }

    /**
     * @notice Convert bytes32 to bytes
     *
     * @param _inBytes32 bytes32 value
     *
     * @return bytes value
     */
    function bytes32ToBytes(bytes32 _inBytes32)
        internal
        pure
        returns (bytes memory bytes_)
    {
        bytes_ = new bytes(32);

        /* solium-disable-next-line */
        assembly {
            mstore(add(32, bytes_), _inBytes32)
        }
    }

}
