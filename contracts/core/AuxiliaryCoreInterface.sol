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

/** @title The interface for the auxiliary core. */
interface AuxiliaryCoreInterface {

    /**
     * @notice Report an Ethereum block's state root at a specific height. You
     *         need to send the appropriate value with the transaction in order
     *         for the state root to be reported.
     *
     * @param _height The height in the Ethereum blockchain that the state root
     *                is reported for.
     * @param _stateRootHash The state root to report at the given height.
     *                       Reverts if the same state root has been reported
     *                       for this height before.
     */
    function reportOriginBlock(
        uint256 _height,
        bytes32 _stateRootHash
    )
        external
        returns (bool);
}
