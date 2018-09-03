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

/** @title Interface for the origin core contract on origin. */
interface OriginCoreInterface {

    /**
     * @notice Proposes a new OSTblock. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _height Height of the OSTblock in the chain of OSTblocks.
     * @param _parent The hash of the parent OSTblock.
     * @param _gas The total consumed gas on auxiliary within this OSTblock.
     * @param _auxiliaryBlockHash The hash of the last finalised checkpoint
     *                            that is part of this OSTblock.
     * @param _auxiliaryDynasty The dynasty number where the OSTblock closes on
     *                          the auxiliary chain.
     * @param _stateRoot The state root of the last finalised checkpoint that
     *                   is part of this OSTblock.
     * @param _transactionRoot The transaction root of the OSTblock. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @param _signatureRoot The root of the trie of votes from the last
     *                       finalised checkpoint to its direct child
     *                       checkpoint.
     * @param _depositedValidators Auxiliary addresses of the validators that
     *                             deposited during the previous OSTblock.
     * @param _loggedOutValidators  Auxiliary addresses of the validators that
     *                              logged out during the previous OSTblock.
     *
     * @return `true` if the proposal succeeds.
     */
    function proposeBlock(
        uint256 _height,
        bytes32 _parent,
        uint256 _gas,
        bytes32 _auxiliaryBlockHash,
        uint256 _auxiliaryDynasty,
        bytes32 _stateRoot,
        bytes32 _transactionRoot,
        bytes32 _signatureRoot,
        address[] _depositedValidators,
        address[] _loggedOutValidators
    )
        external
        returns (bool success_);

    /**
     * @notice Verifies a vote that justified the direct child checkpoint of
     *         the last justified auxiliary checkpoint in the meta-block. A
     *         supermajority of such votes finalise the last auxiliary
     *         checkpoint of this meta-block.
     *
     * @dev Must track which votes have already been verified so that the same
     *      vote never gets verified more than once.
     *
     * @param _metaBlockHash The block hash of the meta-block for which the
     *                       votes shall be verified.
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
     * @return `true` if the verification succeeded.
     */
    function verifyVote(
        bytes32 _metaBlockHash,
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
     * @notice Returns the chain id of the auxiliary chain that this core is
     *         tracking.
     *
     * @return The id of the remote chain.
     */
    function chainIdAuxiliary()
        external
        view
        returns (uint256);

    /**
     * @notice Returns the block height of the latest OSTblock that has been
     *         committed.
     *
     * @dev An OSTblock has been committed if it has been proposed and the
     *      votes have been verified.
     *
     * @return The height of the latest committed OSTblock.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256);

    /**
     * @notice Get the state root of an OSTblock.
     *
     * @param _blockHeight For which block height to get the state root.
     *
     * @return The state root of the OSTblock.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_);
}
