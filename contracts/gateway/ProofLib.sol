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

library ProofLib {

  /**
    *	@notice Convert bytes32 to bytes
    *
    *	@param _inBytes32 bytes32 value
    *
    *	@return bytes value
    */
  function bytes32ToBytes(bytes32 _inBytes32) internal pure returns (bytes) {
    bytes memory res = new bytes(32);
    assembly {
      mstore(add(32,res), _inBytes32)
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
  function storageVariablePath(
    uint8 _index,
    bytes32 _key)
    internal
    pure
    returns(bytes32 /* storage path */)
  {
    bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_index)));
    bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
    bytes memory path = BytesLib.concat(keyBytes, indexBytes);
    return keccak256(abi.encodePacked(keccak256(abi.encodePacked(path))));
  }

  /**
    *	@notice Verify storage of stakingIntents in OpenSTValue and redemptionIntents in OpenSTUtility
    *
    *	@param _intentionStorageIndex index position of storage variables stakingIntents/redemptionIntents
    *	@param _account Account address
    *	@param _accountNonce Nonce for account address
    *	@param _intentHash Intent hash
    *	@param _rlpParentNodes RLP encoded parent nodes for proof verification
    *	@param _storageRoot Storage root
    *
    *	@return bool status if the storage of intent hash was verified
    */
  function verifyIntentStorage(
    uint8 _intentionStorageIndex,
    address _account,
    uint256 _accountNonce,
    bytes32 _intentHash,
    bytes _rlpParentNodes,
    bytes32 _storageRoot)
    internal
    pure
    returns (bool /* verification status */)
  {
    bytes memory traversePath = bytes32ToBytes(storageVariablePath(_intentionStorageIndex, keccak256(abi.encodePacked(_account, _accountNonce))));

    return MerklePatriciaProof.verify(
      keccak256(abi.encodePacked(RLPEncode.encodeItem(bytes32ToBytes(_intentHash)))),
      traversePath,
      _rlpParentNodes,
      _storageRoot);
  }

}
