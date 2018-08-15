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

/**
 *  @title OriginCoreInterface.
 *
 *  @notice Provides interface for origin core contract.
 */
interface OriginCoreInterface {

    /**
     * @notice Returns the chain id of the remote chain that this core is
	 *         tracking.
	 *
	 * @return The id of the remote chain.
     */
    function chainIdRemote()
        external
        view
        returns (uint256);

    /**
     * @notice Returns the block height of the latest OSTblock that has been
     *         committed.
     *
     * @dev An OSTblock has been committed if it has been reported and received
     *      a majority vote from the validators.
     *
     * @return The height of the latest committed OSTblock.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256);

    /**
     * @notice Returns the root of the state tree at the given height.
     *
     * @param _blockHeight The height of the OSTblock for which the state root
     *                     is desired.
     *
     * @return The hash that represents the state root at the given height.
     *         `bytes32(0)` if a state root at the given height is unknown.
     */
    function stateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32);
}