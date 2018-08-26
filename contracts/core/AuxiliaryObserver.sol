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

import "./AuxiliaryObserverConfig.sol";
import "./AuxiliaryObserverInterface.sol";

/**
 * @title AuxiliaryObserver observes the auxiliary chain in a smart contract on
 *        the auxiliary chain.
 */
contract AuxiliaryObserver is AuxiliaryObserverInterface, AuxiliaryObserverConfig {

    /* Events */

    /** Emitted whenever an auxiliary checkpoint is successfully reported. */
    event CheckpointReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /* Structs */

    /**
     * An auxiliary checkpoint.
     *
     * The blockhash is sufficient to identify the checkpoint. The height is
     * required to know the epoch and enforce slashing conditions.
     */
    struct Checkpoint {
        uint256 height;
        bytes32 blockHash;
    }

    /* Public Variables */

    /** The id of the origin chain that this core tracks. */
    uint256 public chainIdOrigin;

    /** Maps the block hash of an auxiliary block at an epoch height to its
     * reported checkpoint.
     */
    mapping (bytes32 => Checkpoint) public reportedCheckpoints;

    /* Constructor */

    /** @param _chainIdOrigin The id of the tracked Ethereum chain. */
    constructor (uint256 _chainIdOrigin) public {
        chainIdOrigin = _chainIdOrigin;
    }

    /* External Functions */

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
    function reportCheckpoint(
        uint256 _height,
        bytes32 _blockHash
    )
        external
        returns (bool success_)
    {
        require(
            _blockHash != bytes32(0),
            "The block hash should not be `0`."
        );

        require(
            _height % EPOCH_LENGTH == 0,
            "The reported height should be a multiple of the epoch length."
        );

        Checkpoint memory reportedCheckpoint = Checkpoint(
            _height,
            _blockHash
        );

        require(
            !checkpointHasBeenReported(reportedCheckpoint),
            "The given checkpoint has already been reported at the same height."
        );

        reportedCheckpoints[_blockHash] = reportedCheckpoint;
        emit CheckpointReported(_height, _blockHash);

        success_ = true;
    }

    /* Private Functions */

    /**
     * @notice Checks whether an auxiliary checkpoint is already recorded.
     *
     * @param _checkpoint The checkpoint to check for.
     *
     * @return `true` if the checkpoint is already recorded.
     */
    function checkpointHasBeenReported(
        Checkpoint _checkpoint
    )
        private
        view
        returns (bool)
    {
        Checkpoint storage checkpoint = reportedCheckpoints[_checkpoint.blockHash];

        return checkpoint.blockHash == _checkpoint.blockHash;
    }
}
