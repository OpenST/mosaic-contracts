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

    /* Public Variables */

    /** The id of the origin chain that this core tracks. */
    uint256 public chainIdOrigin;

    /**
     * Maps the hash of an Ethereum state root to their respective reported
     * block.
     */
    mapping (bytes32 => OriginBlock) public reportedOriginBlocks;

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
            !hasBeenReported(reportedBlock),
            "The given state root has already been reported at the same height."
        );
        
        reportedOriginBlocks[_stateRoot] = reportedBlock;
        emit OriginBlockReported(_height, _stateRoot);

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
    function hasBeenReported(
        OriginBlock _block
    )
        private
        view
        returns (bool)
    {
        OriginBlock storage storedBlock = reportedOriginBlocks[_block.stateRoot];

        return storedBlock.stateRoot == _block.stateRoot;
    }
}
