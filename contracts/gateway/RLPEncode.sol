// Library for RLP encoding a list of bytes arrays.
// Modeled after ethereumjs/rlp (https://github.com/ethereumjs/rlp)
// [Very] modified version of Sam Mayo's library.
pragma solidity ^0.4.23;
import "./BytesLib.sol";

library RLPEncode {

  // Encode an item (bytes)
  function encodeItem(bytes memory self) internal pure returns (bytes) {
    bytes memory encoded;
    encoded = BytesLib.concat(encodeLength(self.length, 128), self);
    return encoded;
  }

  // Generate the prefix for an item or the entire list based on RLP spec
  function encodeLength(uint256 L, uint256 offset) internal pure returns (bytes) {
    bytes memory prefix = new bytes(1);
    prefix[0] = byte(L + offset);
    return prefix;
  }
}
