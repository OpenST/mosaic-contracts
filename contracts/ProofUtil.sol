pragma solidity ^0.4.23;

import "./proof/BytesLib.sol";
import "./proof/util.sol";

contract ProofUtil is Util {

  event StoragePath(uint256 index, address key, bytes indexBytes, bytes keyBytes, bytes k, bytes32 path);

  constructor(){}

  function getStoragePath(
    uint256 _index,
    address _key)
  returns(bytes32 storagePath)
  {
    bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_index)));
    bytes memory keyBytes = BytesLib.leftPad(addressToBytes(_key));
    bytes memory k = BytesLib.concat(keyBytes, indexBytes);
    storagePath = keccak256(keccak256(k));
    emit StoragePath(_index, _key, indexBytes, keyBytes, k, storagePath);
    return storagePath;
  }

  function addressToBytes(address a) constant returns (bytes b){
    assembly {
      let m := mload(0x40)
      mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
      mstore(0x40, add(m, 52))
      b := m
    }
  }
}
