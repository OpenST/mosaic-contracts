pragma solidity ^0.5.0;

// Copyright 2017 OpenST Ltd.
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
// Common: CoreInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title CoreInterface contract.
 *
 *  @notice Provides interface for core contract.
 */
contract CoreInterface {

    /* Public functions */

    function chainIdRemote() public view returns (uint256 /** chainIdRemote */);

    /* External functions */

    /** commitStateRoot external function to be called by game process */
    function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot) external returns (bytes32 /** stateRoot */);
}
