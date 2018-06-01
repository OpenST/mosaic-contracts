pragma solidity ^0.4.23;

import "./proof/BytesLib.sol";
import "./proof/util.sol";

contract Test is Util {
  constructor(){}

  function getStoragePath(
    uint256 _index,
    bytes32 _key)
  returns(bytes32 path)
  {
    bytes memory indexBytes = bytes32ToBytes(bytes32(_index));
    bytes memory keyBytes = bytes32ToBytes(_key);
    bytes k = BytesLib.concat(indexBytes, keyBytes);
    path = keccak256(k);
    return path;
  }

}
