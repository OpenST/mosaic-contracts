pragma solidity ^0.4.0;

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";


library OpenSTUtils {

  function bytes32ToBytes(bytes32 a) internal pure returns (bytes) {
    bytes memory res = new bytes(32);
    assembly {
      mstore(add(32,res), a)
    }
    return res;
  }

  function storagePath(
    uint8 _index,
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

  function verifyIntentStorage(
    uint8 _intentIndex,
    address _address,
    uint256 _addressNonce,
    bytes32 _storageRoot,
    bytes32 _intentHash,
    bytes _rlpParentNodes)
    internal
    pure
    returns (bool)
  {
    bytes32 keyPath = storagePath(_intentIndex, keccak256(_address, _addressNonce));
    bytes memory path = bytes32ToBytes(keccak256(keyPath));
    require(MerklePatriciaProof.verify(
        keccak256(RLPEncode.encodeItem(bytes32ToBytes(_intentHash))),
        path,
        _rlpParentNodes,
        _storageRoot), "Failed to verify storage path");
  }

}
