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
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./ProofLib.sol";

/**
  *	@title ProofLibTest
  *
  *	@dev For testing of ProofLib library
  */
contract ProofLibTest {

/**
  *	@notice Calls storageVariablePath of ProofLib
  *
  *	@dev For testing only
  *
  *	@param _index Index position of the storage variable
  *	@param _key Key of mapping
  *
  *	@return bytes32 Storage path
  */
    function storageVariablePath(
        uint8 _index,
        bytes32 _key)
        external
        pure
        returns(bytes32 /* storage path */)
    {
        return ProofLib.storageVariablePath(_index, _key);
    }


/**
  *	@notice Verifies the intent storage
  *
  *	@dev For testing only
  *
  *	@param _intentIndex Index position of the storage variable
  *	@param _address account address
  *	@param _addressNonce nonce for account address
  *	@param _intentHash value for proof
  *	@param _rlpParentNodes RLP encoded parent nodes
  *	@param _storageRoot storage root for proof
  *
  *	@return bool status of verification
  */
    function verifyIntentStorage(
        uint8 _intentIndex,
        address _address,
        uint256 _addressNonce,
        bytes32 _intentHash,
        bytes _rlpParentNodes,
        bytes32 _storageRoot)
        external
        pure
        returns (bool /* verification status */)
    {
        require(ProofLib.verifyIntentStorage(
                _intentIndex,
                _address,
                _addressNonce,
                _intentHash,
                _rlpParentNodes,
                _storageRoot));

        return true;
    }
}
