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
     * @notice Updates the meta-block height by one and adds the new validators
     *         that should join at this height.
     *         Provide two arrays with the validators' addresses on auxiliary
     *         and their respective weights at the same index. If an auxiliary
     *         address and a weight have the same index in the provided arrays,
     *         they are regarded as belonging to the same validator.
     *
     * @param _validators The addresses of the new validators on the auxiliary
     *                    chain.
     * @param _weights The weights of the validators.
     * @param _originHeight The height of the origin chain where the new
     *                      meta-block opens.
     * @param _auxiliaryHeight The height of the auxiliary checkpoint that is
     *                         the last finalised checkpoint within the
     *                         previous, closed meta-block.
     *
     * @return `true` if the update was successful.
     */
    function updateMetaBlockHeight(
        address[] _validators,
        uint256[] _weights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        external
        returns (bool success_);

    /**
     * @notice Cast a vote from a source to a target.
     *
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transitionHash The hash of the transition object of the
     *                        meta-block that would result from the source
     *                        block being finalised and proposed to origin.
     * @param _source The hash of the source block.
     * @param _target The hash of the target block.
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
        bytes32 _transitionHash,
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
}
