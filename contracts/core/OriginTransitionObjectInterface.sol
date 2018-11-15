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

/** @title The interface for the transition object on origin. */
interface OriginTransitionObjectInterface {

    /**
     * @notice Returns transition hash at the checkpoint defined at the given
     *         block hash.
     *
     * @dev It reverts transaction if checkpoint is not defined at given
     *      block hash.
     *
     * @param _blockHash The hash of the block for which transition object
     *                   is requested.
     *
     * @return transitionHash_ Hash of the transition object at the checkpoint.
     */
    function transitionHashAtBlock(
        bytes32 _blockHash
    )
        external
        view
        returns(bytes32 transitionHash_);

    /**
     * @notice Returns transition object at the checkpoint defined at given
     *         block hash.
     *
     * @dev It reverts transaction if checkpoint is not defined at given
     *      block hash.
     *
     * @param _blockHash The hash of the block for which transition object
     *                   is requested.
     *
     * @return coreIdentifier_ The core identifier identifies the chain that
     *                         this block store is tracking.
     * @return dynasty_  Dynasty number of checkpoint for which transition
     *                   object is requested.
     * @return blockHash_ Hash of the block at checkpoint.
     */
    function transitionObjectAtBlock(
        bytes32 _blockHash
    )
        external
        view
        returns(
            bytes20 coreIdentifier_,
            uint256  dynasty_,
            bytes32 blockHash_
        );
}
