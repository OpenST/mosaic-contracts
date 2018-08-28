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

/** @title The interface for the polling place contract on auxiliary. */
interface PollingPlaceInterface {

    /**
     * @notice Cast a vote from a source to a target.
     *
     * @param _blockStore Address of the block store that stores the blocks
     *                    that are source and target of this vote.
     * @param _source The hash of the source block.
     * @param _target The hash of the target blokc.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _hash The hash of the vote object that is signed.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return `true` if the vote was recorded successfully.
     */
    function vote(
        address _blockStore,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight,
        bytes32 _hash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        external
        returns (bool success_);

    /**
     * @notice Updates the OSTblock height by one and adds the new validators
     *         that should join at this height.
     *         Provide two arrays with the validators' addresses on auxiliary
     *         and their respective stakes at the same index. If an auxiliary
     *         address and a stake have the same index in the provided arrays,
     *         they are regarded as belonging to the same validator.
     *
     * @param _auxiliaryAddresses The addresses of the new validators on the
     *                            auxiliary chain.
     * @param _stakes The stakes of the validators on origin.
     *
     * @return `true` if the update was successful. Reverts otherwise.
     */
    function updateOstBlockHeight(
        address[] _auxiliaryAddresses,
        uint256[] _stakes
    )
        external
        returns (bool success_);
}
