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

/** @title The interface for the general block store on auxiliary. */
interface BlockStoreInterface {

    /**
     * @notice Report a block. A reported block header is stored and can then
     *         be part of subsequent votes.
     *
     * @param _blockHeaderRlp The header of the reported block, RLP encoded.
     *
     * @return `true` if the report succeeded.
     */
    function reportBlock(
        bytes _blockHeaderRlp
    )
        external
        returns (bool success_);

    /**
     * @notice Marks a block in the block store as justified. The source and
     *         the target are required to know when a block is finalised.
     *         Only the polling place may call this method.
     *
     * @param _sourceBlockHash The block hash of the source of the super-
     *                         majority link.
     * @param _targetBlockHash The block hash of the block that is justified.
     */
    function justify(
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        external;

    /**
     * @notice Returns the state root of the block that is stored at the given
     *         height. The height must be <= the height of the latest finalised
     *         checkpoint.
     *
     * @param _height The blockheight.
     *
     * @return The state root of the block at the given height.
     */
    function stateRoot(
        uint256 _height
    )
        external
        view
        returns (bytes32 stateRoot_);

    /**
     * @notice Returns the core identifier of the chain that this block store
     *         tracks.
     *
     * @return coreIdentifier_ The core identifier of the tracked chain.
     */
    function coreIdentifier() external view returns (bytes20 coreIdentifier_);

    /**
     * @notice Returns the height of the latest block that has been finalised.
     *
     * @return The height of the latest finalised block.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256 height_);

    /**
     * @notice Validates a given vote. For a vote to be valid:
     *         - The transition object must be correct
     *         - The hashes must exist
     *         - The blocks of the hashes must be at checkpoint heights
     *         - The source checkpoint must be justified
     *         - The target must be higher than the current head
     *
     * @param _transitionHash The hash of the transition object of the related
     *                        meta-block. Depends on the source block.
     * @param _sourceBlockHash The hash of the source checkpoint of the vote.
     * @param _targetBlockHash The hash of teh target checkpoint of the vote.
     *
     * @return `true` if all of the above apply and therefore the vote is
     *         considered valid by the block store. `false` otherwise.
     */
    function isVoteValid(
        bytes32 _transitionHash,
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        external
        view
        returns (bool valid_);

    /**
     * @notice Check, whether a block with a given block hash has been reported
     *         before.
     *
     * @param _blockHash The hash of the block that should be checked.
     *
     * @return `true` if the block has been reported before.
     */
    function isBlockReported(
        bytes32 _blockHash
    )
        external
        view
        returns (bool reported_);
}
