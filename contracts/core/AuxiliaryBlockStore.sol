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

import "../lib/Block.sol";
import "../lib/SafeMath.sol";
import "./BlockStore.sol";

/**
 * @title The auxiliary block store stores observations about the auxiliary
 *        chain.
 */
contract AuxiliaryBlockStore is BlockStore {
    using SafeMath for uint256;

    /* Variables */

    /** Maps a block hash to the accumulated gas at that block. */
    mapping(bytes32 => uint256) public accumulatedGases;

    /** Maps a block hash to the accumulated transaction root at that block. */
    mapping(bytes32 => bytes32) public accumulatedTransactionRoots;

    /* Constructor */

    /**
     * @notice Construct a new block store. Requires the block hash, state
     *         root, and block height of an initial starting block. Depending
     *         on which chain this store tracks, this could be a different
     *         block than genesis.
     *
     * @param _coreIdentifier The core identifier identifies the chain that
     *                        this block store is tracking.
     * @param _epochLength The epoch length is the number of blocks from one
     *                     checkpoint to the next.
     * @param _pollingPlace The address of the polling place address. Only the
     *                      polling place may call the justify method.
     * @param _initialBlockHash The block hash of the initial starting block.
     * @param _initialStateRoot The state root of the initial starting block.
     * @param _initialBlockHeight The block height of the initial starting
     *                            block.
     * @param _initialGas The initial gas to start tracking the accumulated gas
     *                    from.
     * @param _initialTransactionRoot The initial transaction root to start
     *                                tracking the accumulated transaction root
     *                                from.
     */
    constructor (
        bytes20 _coreIdentifier,
        uint256 _epochLength,
        address _pollingPlace,
        bytes32 _initialBlockHash,
        bytes32 _initialStateRoot,
        uint256 _initialBlockHeight,
        uint256 _initialGas,
        bytes32 _initialTransactionRoot
    )
        BlockStore(
            _coreIdentifier,
            _epochLength,
            _pollingPlace,
            _initialBlockHash,
            _initialStateRoot,
            _initialBlockHeight
        )
        public
    {
        accumulatedGases[_initialBlockHash] = _initialGas;
        accumulatedTransactionRoots[_initialBlockHash] = _initialTransactionRoot;
    }

    /* External Functions */

    /**
     * @notice Report a block. A reported block header is stored and can then
     *         be part of subsequent votes.
     *
     * @param _blockHeaderRlp The header of the reported block, RLP encoded.
     */
    function reportBlock(
        bytes _blockHeaderRlp
    )
        external
        returns (bool success_)
    {
        Block.Header memory header = Block.decodeHeader(_blockHeaderRlp);

        require(
            super.isReported(header.parentHash),
            "The parent of a reported block must be reported first."
        );

        Block.Header storage parent = reportedBlocks[header.parentHash];
        require(
            parent.height == header.height.sub(1),
            "The parent must have a height of one below the reported header."
        );

        success_ = super.reportBlock_(header);

        if (success_) {
            accumulatedGases[header.blockHash] = accumulatedGases[header.parentHash].add(
                header.gasUsed
            );

            accumulatedTransactionRoots[header.blockHash] = keccak256(
                abi.encode(
                    accumulatedTransactionRoots[header.parentHash],
                    header.transactionRoot
                )
            );
        }
    }

    /* Internal Functions */

    /**
     * @notice Checks if a target block is valid. The same criteria apply for
     *         voting and justifying, as justifying results from voting.
     *
     * @dev In addition to the general block store's check whether a target is
     *      valid, here it also has to be a descendant of the source block.
     *
     * @param _sourceBlockHash The hash of the corresponding source.
     * @param _targetBlockHash The hash of the potential target block.
     *
     * @return valid_ `true` if the given block hash is a valid target.
     * @return reason_ Gives the reason in case the block is not a valid target.
     */
    function isTargetValid(
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        internal
        view
        returns (bool valid_, string reason_)
    {
        (valid_, reason_) = super.isTargetValid(
            _sourceBlockHash,
            _targetBlockHash
        );

        if (
            valid_ &&
            !isAncestorCheckpoint(_sourceBlockHash, _targetBlockHash)
        ) {
            valid_ = false;
            reason_ = "The source must be an ancestor of the target.";
        }
    }

    /* Private Functions */

    /**
     * @notice Checks whether there is a chain of blocks and checkpoints from
     *         the ancestor to the descendant. It first goes back from the
     *         descendant along blocks to the latest checkpoint. Then it
     *         continues along the list of checkpoints and checks whether it can
     *         reach the ancestor.
     *
     * @param _ancestor The block hash of the ancestor. Must be a justified
     *                  checkpoint.
     * @param _descendant The block hash of the descendant. Mist be a reported
     *                    block.
     *
     * @return isAncestor_ `true` if it finds a path from the descendant to the
     *                     ancestor.
     */
    function isAncestorCheckpoint(
        bytes32 _ancestor,
        bytes32 _descendant
    )
        private
        view
        returns (bool isAncestor_)
    {
        /*
         * Walk along list of blocks to closest checkpoint. The descendant is
         * not (yet) a justified checkpoint, so we first need to find the
         * closest (youngest) checkpoint.
         */
        Block.Header storage currentBlock = reportedBlocks[_descendant];
        while (
            checkpoints[currentBlock.blockHash].blockHash != currentBlock.blockHash
        ) {
            currentBlock = reportedBlocks[currentBlock.parentHash];
        }

        /*
         * Walk along list of checkpoints to correct height. This is more
         * efficient as it skips across blocks in between checkpoints.
         */
        Checkpoint storage currentCheckpoint = checkpoints[currentBlock.blockHash];
        while (
            reportedBlocks[currentCheckpoint.blockHash].height > reportedBlocks[_ancestor].height
        ) {
            currentCheckpoint = checkpoints[currentCheckpoint.parent];
        }

        isAncestor_ = currentCheckpoint.blockHash == _ancestor;
    }
}
