pragma solidity ^0.4.23;

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";


library OpenSTUtils {

  /**
    *	@notice Convert bytes32 to bytes
    *
    *	@param a bytes32 value
    *
    *	@return bytes value
    */
  function bytes32ToBytes(bytes32 a) internal pure returns (bytes) {
    bytes memory res = new bytes(32);
    assembly {
      mstore(add(32,res), a)
    }
    return res;
  }

  /**
    *	@notice Get the storage path of the variable
    *
    *	@param _index Index of variable
    *	@param _key Key of variable incase of mapping
    *
    *	@return bytes32 Storage path of the variable
    */
  function storagePath(
    uint8 _index,
    bytes32 _key)
    internal
    pure
    returns(bytes32 /* storage path */)
  {
    bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_index)));
    bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
    bytes memory path = BytesLib.concat(keyBytes, indexBytes);
    return keccak256(keccak256(path));
  }

  /**
    *	@notice Verify storage of intent hash
    *
    *	@param _intentIndex Index of variable
    *	@param _address Account address
    *	@param _addressNonce Nonce for account address
    *	@param _storageRoot Storage root
    *   @param _intentHash Intent hash
    *	@param _rlpParentNodes RLP encoded parent nodes for proof verification
    *
    *	@return bool status if the storage of intent hash was verified
    */
  function verifyIntentStorage(
    uint8 _intentIndex,
    address _address,
    uint256 _addressNonce,
    bytes32 _storageRoot,
    bytes32 _intentHash,
    bytes _rlpParentNodes)
    internal
    pure
    returns (bool /* verification status */)
  {
    bytes32 keyPath = storagePath(_intentIndex, keccak256(_address, _addressNonce));
    //bytes memory path = bytes32ToBytes(keccak256(keyPath));
    bytes memory path = bytes32ToBytes(keyPath);
    bytes32 encodedData = keccak256(RLPEncode.encodeItem(bytes32ToBytes(_intentHash)));

    return MerklePatriciaProof.verify(
      encodedData,
      path,
      _rlpParentNodes,
      _storageRoot);
  }

  function verifyDebugIntentStorage(
    uint8 _intentIndex,
    address _address,
    uint256 _addressNonce,
    bytes32 _storageRoot,
    bytes32 _intentHash,
    bytes _rlpParentNodes)
  internal
  pure
  returns (bool res, uint loc, bytes path_debug /* verification status */)
  {
    bytes32 keyPath = storagePath(_intentIndex, keccak256(_address, _addressNonce));
    bytes memory path = bytes32ToBytes(keccak256(keyPath));
    bytes32 encodedData = keccak256(RLPEncode.encodeItem(bytes32ToBytes(_intentHash)));

    return MerklePatriciaProof.verifyDebug(
      encodedData,
      path,
      _rlpParentNodes,
      _storageRoot);
  }

  function getPath(
    uint8 _intentIndex,
    address _address,
    uint256 _addressNonce,
    bytes32 _storageRoot,
    bytes32 _intentHash,
    bytes _rlpParentNodes)
  internal
  pure
    //returns (bool /* verification status */)
  returns (bytes32, bytes, bytes32 /* verification status */)
  {
    bytes32 keyPath = storagePath(_intentIndex, keccak256(_address, _addressNonce));
    bytes memory path = bytes32ToBytes(keyPath);

    bytes32 encodedData = keccak256(RLPEncode.encodeItem(bytes32ToBytes(_intentHash)));
    bytes memory ed = RLPEncode.encodeItem(bytes32ToBytes(_intentHash));
    return (keyPath, ed, encodedData);
  }


  function temp1(
    uint8 _intentIndex,
    address _address,
    uint256 _addressNonce
    )
  internal
  pure
  returns (bytes32 /* verification status */)
  {
    return storagePath(_intentIndex, keccak256(_address, _addressNonce));
  }

}
