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

import "./AuxiliaryCoreConfig.sol";
import "./AuxiliaryCoreInterface.sol";

/**
 * @title AuxiliaryCore observes the origin chain in a smart contract on the auxiliary chain.
 */
contract AuxiliaryCore is AuxiliaryCoreInterface, AuxiliaryCoreConfig {

    /* Events */

    /** Emitted whenever a block from origin is successfully reported. */
    event OriginBlockReported(
        uint256 indexed height,
        bytes32 indexed stateRoot
    );

    /** Emitted whenever an auxiliary checkpoint is successfully reported. */
    event AuxiliaryCheckpointReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /* Structs */

    /**
     * A block header of the origin chain at a height.
     *
     * As Ethereum can fork, multiple state roots can be reported for
     * the same height.
     * It is sufficient to only store the state roots of Ethereum. The Casper
     * FFG rules will assert that only the correct state roots will be
     * finalised. Falsely reported state roots will consume `msg.value` that
     * won't ever be returned to the sender of the wrong state root.
     */
    struct OriginBlock {
        uint256 height;
        bytes32 stateRoot;
    }

    /**
     * An auxiliary checkpoint.
     *
     * The blockhash is sufficient to identify the checkpoint. The height is
     * required to know the epoch and enforce slashing conditions.
     */
    struct AuxiliaryCheckpoint {
        uint256 height;
        bytes32 blockHash;
    }

    /* Public Variables */

    /** The id of the origin chain that this core tracks. */
    uint256 public chainIdOrigin;

    /**
     * Maps the hash of an Ethereum state root to their respective reported
     * block.
     */
    mapping (bytes32 => OriginBlock) public reportedOriginBlocks;

    /** Maps the block hash of an auxiliary block at an epoch height to its
     * reported checkpoint.
     */
    mapping (bytes32 => AuxiliaryCheckpoint) public reportedAuxiliaryCheckpoints;

    /* Constructor */

    /** @param _chainIdOrigin The id of the tracked Ethereum chain. */
    constructor (uint256 _chainIdOrigin) public {
        chainIdOrigin = _chainIdOrigin;
    }

    /* External Functions */

    /**
     * @notice Report an Ethereum block's state root at a specific height. You
     *         need to send the appropriate value with the transaction in order
     *         for the state root to be reported.
     *
     * @param _height The height in the Ethereum blockchain that the block is
     *                reported for.
     * @param _stateRoot The state root to report at the given height.
     *                   Reverts if the same state root has been reported
     *                   before.
     */
    function reportOriginBlock(
        uint256 _height,
        bytes32 _stateRoot
    )
        external
        payable
        returns (bool success_)
    {
        require(
            _stateRoot != bytes32(0),
            "The state root should not be `0`."
        );

        require(
            msg.value == COST_REPORT_STATE_ROOT,
            "You must send exactly the required amount of value to report a block."
        );

        OriginBlock memory reportedBlock = OriginBlock(
            _height,
            _stateRoot
        );

        require(
            !originBlockHasBeenReported(reportedBlock),
            "The given state root has already been reported at the same height."
        );
        
        reportedOriginBlocks[_stateRoot] = reportedBlock;
        emit OriginBlockReported(_height, _stateRoot);

        success_ = true;
    }

    /**
     * @notice Report a checkpoint of auxiliary to this core contract. A
     *         checkpoint must be at a height that is a multiple of the epoch
     *         length. You can report every checkpoint only once.
     *
     * @param _height The block height of the checkpoint.
     * @param _blockHash The block hash of the block at the checkpoint.
     *
     * @return `true` if the report succeeded. Reverts if it fails.
     */
    function reportAuxiliaryCheckpoint(
        uint256 _height,
        bytes32 _blockHash
    )
        external
        payable
        returns (bool success_)
    {
        require(
            _blockHash != bytes32(0),
            "The block hash should not be `0`."
        );

        require(
            _height % AUXILIARY_EPOCH_LENGTH == 0,
            "The reported height should be a multiple of the epoch length."
        );

        AuxiliaryCheckpoint memory reportedCheckpoint = AuxiliaryCheckpoint(
            _height,
            _blockHash
        );

        require(
            !auxiliaryCheckpointHasBeenReported(reportedCheckpoint),
            "The given checkpoint has already been reported at the same height."
        );

        reportedAuxiliaryCheckpoints[_blockHash] = reportedCheckpoint;
        emit AuxiliaryCheckpointReported(_height, _blockHash);

        success_ = true;
    }

    /* Private Functions */

    /**
     * @notice Checks whether a block is already recorded.
     *
     * @param _block The block to check for.
     *
     * @return `true` if the state root hash is already recorded.
     */
    function originBlockHasBeenReported(
        OriginBlock _block
    )
        private
        view
        returns (bool)
    {
        OriginBlock storage storedBlock = reportedOriginBlocks[_block.stateRoot];

        return storedBlock.stateRoot == _block.stateRoot;
    }

    /**
     * @notice Checks whether an auxiliary checkpoint is already recorded.
     *
     * @param _checkpoint The checkpoint to check for.
     *
     * @return `true` if the checkpoint is already recorded.
     */
    function auxiliaryCheckpointHasBeenReported(
        AuxiliaryCheckpoint _checkpoint
    )
        private
        view
        returns (bool)
    {
        AuxiliaryCheckpoint storage checkpoint = reportedAuxiliaryCheckpoints[_checkpoint.blockHash];

        return checkpoint.blockHash == _checkpoint.blockHash;
    }
}
