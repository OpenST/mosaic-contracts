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
import "../lib/MetaBlock.sol";
import "../lib/SafeMath.sol";
import "./BlockStoreInterface.sol";

/**
 * @title A block store stores blocks of a block chain.
 *
 * @notice The block store stores headers of blocks. Not all headers have to be
 *         reported. It is only required to report all headers that should
 *         become justified checkpoints.
 *         The block store tracks all justifications and finalisations through
 *         calls to the `justify()` method. Only the polling place can call
 *         that method.
 */
contract BlockStore is BlockStoreInterface {
    using SafeMath for uint256;

    /* Events */

    /** Logs that a block has been reported. */
    event BlockReported(bytes32 blockHash);

    /** Logs that a block has been justified. */
    event BlockJustified(bytes32 blockHash);

    /** Logs that a block has been finalised. */
    event BlockFinalised(bytes32 blockHash);

    /* Structs */

    /** A casper FFG checkpoint. */
    struct Checkpoint {
        /** The block hash of the block at this checkpoint. */
        bytes32 blockHash;

        /** The hash of the block of the parent checkpoint (not block) */
        bytes32 parent;

        /** Is true if the checkpoint has been justified. */
        bool justified;

        /** Is true if the checkpoint has been finalised. */
        bool finalised;

        /**
         * The dynasty of block b is the number of finalized checkpoints in the
         * chain from the starting checkpoint to the parent of block b.
         */
        uint256 dynasty;
    }

    /* Public Variables */

    /**
     * The core identifier identifies the chain that this block store is
     * tracking.
     */
    bytes20 public coreIdentifier;

    /**
     * The epoch length is the number of blocks from one checkpoint to the
     * next.
     */
    uint256 public epochLength;

    /**
     * If this block store doesn't start tracking a chain from origin, then the
     * starting height is the first block of the block chain where tracking
     * starts. For the purpose of Casper FFG it is considered the genesis.
     */
    uint256 public startingHeight;

    /**
     * The address of the polling place address. Only the polling place may
     * call the justify method.
     */
    address public pollingPlace;

    /** A mapping of block hashes to their reported headers. */
    mapping (bytes32 => Block.Header) private reportedBlocks;

    /** A mapping of block headers to their recorded checkpoints. */
    mapping (bytes32 => Checkpoint) public checkpoints;

    /** The block hash of the highest finalised checkpoint. */
    bytes32 public head;

    /**
     * The current dynasty. The highest finalised checkpoint's dynasty is one
     * less.
     */
    uint256 public currentDynasty;

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
     */
    constructor (
        bytes20 _coreIdentifier,
        uint256 _epochLength,
        address _pollingPlace,
        bytes32 _initialBlockHash,
        bytes32 _initialStateRoot,
        uint256 _initialBlockHeight
    )
        public
    {
        require(
            _epochLength > 0,
            "Epoch length must be greater zero."
        );
        require(
            _pollingPlace != address(0),
            "Address of polling place must not be zero."
        );
        require(
            _initialBlockHash != bytes32(0),
            "Initial block hash must not be zero."
        );
        require(
            _initialStateRoot != bytes32(0),
            "Initial state root must not be zero."
        );
        require(
            _initialBlockHeight % _epochLength == 0,
            "The initial block height is incompatible to the epoch length. Must be a multiple."
        );

        coreIdentifier = _coreIdentifier;
        epochLength = _epochLength;
        pollingPlace = _pollingPlace;
        startingHeight = _initialBlockHeight;

        reportedBlocks[_initialBlockHash] = Block.Header(
            _initialBlockHash,
            bytes32(0),
            bytes32(0),
            address(0),
            _initialStateRoot,
            bytes32(0),
            bytes32(0),
            new bytes(0),
            uint256(0),
            _initialBlockHeight,
            uint64(0),
            uint64(0),
            uint256(0),
            new bytes(0),
            bytes32(0),
            uint256(0)
        );

        checkpoints[_initialBlockHash] = Checkpoint(
            _initialBlockHash,
            bytes32(0),
            true,
            true,
            uint256(0)
        );

        currentDynasty = uint256(1);
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
        reportedBlocks[header.blockHash] = header;

        emit BlockReported(header.blockHash);

        success_ = true;
    }

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
        external
    {
        require(
            msg.sender == pollingPlace,
            "This method must be called frome the registered polling place."
        );

        bool blockValid;
        string memory reason;

        (blockValid, reason) = isSourceValid(_sourceBlockHash);
        require(blockValid, reason);

        (blockValid, reason) = isTargetValid(
            _sourceBlockHash,
            _targetBlockHash
        );
        require(blockValid, reason);

        isValidTransitionHash(_sourceBlockHash, _sourceBlockHash);

        // Finalise first as it may increase the dynasty number of target.
        if (distanceInEpochs(_sourceBlockHash, _targetBlockHash) == 1) {
            finalise(_sourceBlockHash);
        }

        Checkpoint memory checkpoint = Checkpoint(
            _targetBlockHash,
            _sourceBlockHash,
            true,
            false,
            currentDynasty
        );
        checkpoints[_targetBlockHash] = checkpoint;

        emit BlockJustified(_targetBlockHash);
    }

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
        returns (bytes32 stateRoot_)
    {
        require(
            _height <= reportedBlocks[head].height,
            "The state root is only known up to the height of the last finalised checkpoint."
        );

        require(
            _height >= startingHeight,
            "The state root is only known from the starting height upwards."
        );

        /*
         * Walk backwards along the list of checkpoints as long as the height
         * of the checkpoint is greater than the target height.
         */
        Checkpoint storage checkpoint = checkpoints[head];
        while (reportedBlocks[checkpoint.blockHash].height > _height) {
            checkpoint = checkpoints[checkpoint.parent];
        }

        /*
         * If the height of the resulting header is different from the height
         * that was given, then the given height was in between two justified
         * checkpoints. The height was skipped over when traversing the
         * recorded checkpoints.
         */
        Block.Header storage header = reportedBlocks[checkpoint.blockHash];
        require(
            header.height == _height,
            "State roots are only known for heights at justified checkpoints."
        );

        stateRoot_ = header.stateRoot;
    }

    /**
     * @notice Returns the height of the latest block that has been finalised.
     *
     * @return The height of the latest finalised block.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256 height_)
    {
        height_ = reportedBlocks[head].height;
    }

    /**
     * @notice Validates a given vote. For a vote to be valid:
     *         - The transition object must be correct and
     *         - The hashes must exist and
     *         - The blocks of the hashes must be at checkpoint heights and
     *         - The source checkpoint must be justified and
     *         - The target must be higher than the current head.
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
        returns (bool valid_)
    {
        bool sourceValid;
        bool targetValid;
        bool transitionValid;

        (sourceValid,) = isSourceValid(_sourceBlockHash);
        (targetValid,) = isTargetValid(
            _sourceBlockHash,
            _targetBlockHash
        );
        transitionValid = isValidTransitionHash(
            _transitionHash,
            _sourceBlockHash
        );

        return sourceValid && targetValid && transitionValid;
    }

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
        returns (bool reported_)
    {
        reported_ = reportedBlocks[_blockHash].blockHash == _blockHash;
    }

    /* Private Functions */

    /**
     * @notice Finalises the checkpoint at the given block hash. Updates the
     *         current head and dynasty if it is above the old head.
     *
     * @param _blockHash The checkpoint that shall be finalised.
     */
    function finalise(bytes32 _blockHash) private {
        checkpoints[_blockHash].finalised = true;

        if (reportedBlocks[_blockHash].height > reportedBlocks[head].height) {
            head = _blockHash;
            currentDynasty++;
        }

        emit BlockFinalised(_blockHash);
    }

    /**
     * @notice Checks if a source block is valid. The same criteria apply for
     *         voting and justifying, as justifying results from voting.
     *
     * @param _sourceBlockHash The hash of the potential source block.
     *
     * @return valid_ `true` if the given block hash is a valid source.
     * @return reason_ Gives the reason in case the block is not a valid source.
     */
    function isSourceValid(
        bytes32 _sourceBlockHash
    )
        private
        view
        returns (bool valid_, string reason_)
    {
        if(!isReported(_sourceBlockHash)) {
            valid_ = false;
            reason_ = "The source block must first be reported.";
        } else if (!isJustified(_sourceBlockHash)) {
            valid_ = false;
            reason_ = "The source block must first be justified.";
        } else {
            valid_ = true;
        }
    }

    /**
     * @notice Checks if a target block is valid. The same criteria apply for
     *         voting and justifying, as justifying results from voting.
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
        private
        view
        returns (bool valid_, string reason_)
    {
        if (!isReported(_targetBlockHash)) {
            valid_ = false;
            reason_ = "The target block must first be reported.";
        } else if (!isAtCheckpointHeight(_targetBlockHash)) {
            valid_ = false;
            reason_ = "The target must be at a height that is a multiple of the epoch length.";
        } else if (!isAboveHead(_targetBlockHash)) {
            valid_ = false;
            reason_ = "The target must be higher than the head.";
        } else if (!isAbove(_targetBlockHash, _sourceBlockHash)) {
            valid_ = false;
            reason_ = "The target must be above the source in height.";
        } else {
            valid_ = true;
        }
    }

    /**
     * @notice Returns true if the given block hash corresponds to a block that
     *         has been reported.
     *
     * @param _blockHash The block hash to check.
     *
     * @return `true` if the given block hash was reported before.
     */
    function isReported(
        bytes32 _blockHash
    )
        private
        view
        returns (bool wasReported_)
    {
        wasReported_ = reportedBlocks[_blockHash].blockHash == _blockHash;
    }

    /**
     * @notice Returns true if the given block hash corresponds to a checkpoint
     *         that has been justified.
     *
     * @param _blockHash The block hash to check.
     *
     * @return `true` if there exists a justified checkpoint at the given block
     *         hash.
     */
    function isJustified(
        bytes32 _blockHash
    )
        private
        view
        returns (bool justified_)
    {
        justified_ = checkpoints[_blockHash].justified;
    }

    /**
     * @notice Returns true if the given block hash corresponds to a block at a
     *         valid checkpoint height (multiple of the epoch length).
     *
     * @param _blockHash The block hash to check.
     *
     * @return `true` if the given block hash is at a valid height.
     */
    function isAtCheckpointHeight(
        bytes32 _blockHash
    )
        private
        view
        returns (bool atBlockChainHeight_)
    {
        uint256 blockHeight = reportedBlocks[_blockHash].height;
        atBlockChainHeight_ = blockHeight % epochLength == 0;
    }

    /**
     * @notice Returns true if the first block has a greater height than the
     *         second block.
     *
     * @param _firstBlockHash Hash of the first block.
     * @param _secondBlockHash Hash of the second block.
     *
     * @return `true` if the first block has a greater height than the second
     *         block.
     */
    function isAbove(
        bytes32 _firstBlockHash,
        bytes32 _secondBlockHash
    )
        private
        view
        returns (bool above_)
    {
        uint256 firstHeight = reportedBlocks[_firstBlockHash].height;
        uint256 secondHeight = reportedBlocks[_secondBlockHash].height;
        return firstHeight > secondHeight;
    }

    /**
     * @notice Returns true if the given block hash corresponds to a block that
     *         is above the currently highest finalised checkpoint.
     *
     * @param _blockHash The block hash to check.
     *
     * @return `true` if the given block hash is above the highest finalised
     *         checkpoint.
     */
    function isAboveHead(
        bytes32 _blockHash
    )
        private
        view
        returns (bool aboveHead_)
    {
        aboveHead_ = isAbove(_blockHash, head);
    }

    /**
     * @notice Calculates and returns the number of epochs between two given
     *         blocks.
     *
     * @param _lowerBlockHash Block hash of the lower block.
     * @param _higherBlockHash Block hash of the higher block.
     *
     * @return The distance between the given blocks in number of epochs.
     */
    function distanceInEpochs(
        bytes32 _lowerBlockHash,
        bytes32 _higherBlockHash
    )
        private
        view
        returns (uint256 epochDistance_)
    {
        /*
         * Other parts of the code checked that the blocks are at valid heights
         * and in the right order so this should always calculate correctly.
         */
        uint256 lowerHeight = reportedBlocks[_lowerBlockHash].height;
        uint256 higherHeight = reportedBlocks[_higherBlockHash].height;
        uint256 blockDistance = higherHeight.sub(lowerHeight);
        epochDistance_ = blockDistance.div(epochLength);
    }

    /**
     * @notice Takes a transition hash and checks that the given block results
     *         in the same transition hash.
     *
     * @param _transitionHash The hash to check.
     * @param _blockHash The block to test the hash against.
     *
     * @return `true` if the given block results in the same transition hash.
     */
    function isValidTransitionHash(
        bytes32 _transitionHash,
        bytes32 _blockHash
    )
        private
        view
        returns (bool valid_)
    {
        bytes32 expectedHash = MetaBlock.hashOriginTransition(
            checkpoints[_blockHash].dynasty,
            _blockHash,
            coreIdentifier
        );

        return _transitionHash == expectedHash;
    }
}
