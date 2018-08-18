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
 * @title AuxiliaryCore tracks an Ethereum blockchain on a proof of stake chain.
 */
contract AuxiliaryCore is AuxiliaryCoreInterface, AuxiliaryCoreConfig {

    /* Events */

    /** Emitted whenever a state root is successfully reported. */
    event StateRootReported(
        uint256 indexed height,
        bytes32 indexed stateRoot
    );

    /* Public Variables */

    /** The id of the origin chain that this core tracks. */
    uint256 public chainIdOrigin;

    /**
     * Maps heights on the Ethereum blockchain to their respoctive reported
     * state root. As Ethereum can fork, multiple state roots can be reported
     * for the same height.
     * It is sufficient to only store the state roots of Ethereum. The Casper
     * FFG rules will assert that only the correct state roots will be
     * finalised. Falsely reported state roots will consume `msg.value` that
     * won't ever be returned to the sender of the wrong state root.
     */
    mapping (uint256 => bytes32[]) public reportedStateRoots;

    /* Constructor */

    /** @param _chainIdOrigin The id of the tracked Ethereum chain. */
    constructor (uint256 _chainIdOrigin) public {
        chainIdOrigin = _chainIdOrigin;
    }

    /* External Functions */

    /**
     * @notice Report an Ethereum state root at a specific height. You need to
     *         send the appropriate value with the transaction in order for the
     *         state root to be reported.
     *
     * @param _height The height in the Ethereum blockchain that the state root
     *                is reported for.
     * @param _stateRoot The state root to report at the given height. Reverts
     *                   if the same state root has been reported for this
     *                   height before.
     */
    function reportStateRoot(
        uint256 _height,
        bytes32 _stateRoot
    )
        external
        payable
    {
        require(
            _stateRoot != bytes32(0),
            "The state root should not be `0`."
        );

        require(
            msg.value >= COST_REPORT_STATE_ROOT,
            "You must send at least the required amount of value to report a state root."
        );

        require(
            !hasBeenReported(_height, _stateRoot),
            "The given state root has already been reported at the same height."
        );
        
        reportedStateRoots[_height].push(_stateRoot);
        emit StateRootReported(_height, _stateRoot);
    }

    /**
     * @notice Returns all the state roots that have been reported at a given
     *         height.
     *
     * @param _height The height for which to get the reported state roots.
     *
     * @return The state roots that have been reported at the given height.
     */
    function getReportedStateRoots(
        uint256 _height
    )
        external
        view
        returns (bytes32[])
    {
        return reportedStateRoots[_height];
    }

    /* Private Functions */

    /**
     * @notice Checks whether a state root is already recorded at a given
     *         height of the origin blockchain.
     *
     * @dev Iterates over all recorded state roots and returns true when one is
     *      equal to the state root that is given.
     *
     * @param _height The height for which to check.
     * @param _stateRoot The state root to chekc for.
     *
     * @return `true` if the state root is already recorded at the given
     *         height.
     */
    function hasBeenReported(
        uint256 _height,
        bytes32 _stateRoot
    )
        private
        view
        returns (bool)
    {
        for (uint256 i = 0; i < reportedStateRoots[_height].length; i++) {
            if (reportedStateRoots[_height][i] == _stateRoot) {
                return true;
            }
        }

        return false;
    }
}
