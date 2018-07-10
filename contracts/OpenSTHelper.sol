pragma solidity ^0.4.23;


// Copyright 2018 OpenST Ltd.
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

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";


/**
  *	@title OpenSTHelper
  */
// Please note that this library exists for 0.9.3 and going forward will be merged with Utils.sol.
library OpenSTHelper {

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
    bytes memory path = bytes32ToBytes(keyPath);

    return MerklePatriciaProof.verify(
      keccak256(RLPEncode.encodeItem(bytes32ToBytes(_intentHash))),
      path,
      _rlpParentNodes,
      _storageRoot);
  }

}
