pragma solidity ^0.5.0;

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

/** @title An interface to an get state root. */
interface StateRootInterface {

    /**
     * @notice Gets the block number of latest anchored state root.
     *
     * @return uint256 Block height of the latest anchored state root.
     */
    function getLatestStateRootBlockHeight()
        external
        view
        returns (uint256 height_);

    /**
     * @notice Get the state root for the given block height.
     *
     * @param _blockHeight The block height for which the state root is fetched.
     *
     * @return bytes32 State root at the given height.
     */
    function getStateRoot(uint256 _blockHeight)
        external
        view
        returns (bytes32 stateRoot_);

}
