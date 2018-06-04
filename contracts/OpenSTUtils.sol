pragma solidity ^0.4.0;

import "./proof/BytesLib.sol";

library OpenSTUtils {

  function bytes32ToBytes(bytes32 a) internal pure returns (bytes) {
    bytes memory res = new bytes(32);
    assembly {
      mstore(add(32,res), a)
    }
    return res;
  }

  function storagePath(
    uint256 _index,
    bytes32 _key)
    internal
    pure
    returns(bytes32)
  {
    bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_index)));
    bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
    bytes memory path = BytesLib.concat(keyBytes, indexBytes);
    return keccak256(keccak256(path));
  }
  
}
