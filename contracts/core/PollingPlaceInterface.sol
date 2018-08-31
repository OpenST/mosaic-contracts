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
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _source The hash of the source block.
     * @param _target The hash of the target blokc.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return `true` if the vote was recorded successfully.
     */
    function vote(
        bytes20 _coreIdentifier,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight,
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
     *         and their respective weights at the same index. If an auxiliary
     *         address and a weight have the same index in the provided arrays,
     *         they are regarded as belonging to the same validator.
     *
     * @param _validators The addresses of the new validators on the auxiliary
     *                    chain.
     * @param _weights The weights of the validators.
     *
     * @return `true` if the update was successful.
     */
    function updateOstBlockHeight(
        address[] _validators,
        uint256[] _weights
    )
        external
        returns (bool success_);
}
