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
     * @notice Proposes a new meta-block. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _height Height of the meta-block in the chain of meta-blocks.
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _kernelHash The hash of the current kernel.
     * @param _auxiliaryDynasty The dynasty number where the meta-block closes
     *                          on the auxiliary chain.
     * @param _auxiliaryBlockHash The block hash where the meta-block closes
     *                          on the auxiliary chain.
     * @param _gas The total consumed gas on auxiliary within this meta-block.
     * @param _originDynasty Dynasty of origin block within latest meta-block
     *                          reported at auxiliary chain.
     * @param _originBlockHash Block hash of origin block within latest
     *                          meta-block reported at auxiliary chain.
     * @param _transactionRoot The transaction root of the meta-block. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @return `true` if the proposal succeeds.
     */
    function proposeBlock(
        uint256 _height,
        bytes32 _coreIdentifier,
        bytes32 _kernelHash,
        uint256 _auxiliaryDynasty,
        bytes32 _auxiliaryBlockHash,
        uint256 _gas,
        uint256 _originDynasty,
        bytes32 _originBlockHash,
        bytes32 _transactionRoot
    )
        external
        returns (bool);

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
     * @param _transition The hash of the transition part of the meta-block
     *                    header at the source block.
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
        bytes32 _transition,
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
     * @notice The identifier of the remote chain core that is tracked by this core.
     *
     * @return The identifier of auxiliary core.
     */
    function auxiliaryCoreIdentifier()
        external
        view
        returns (bytes32);

    /**
     * @notice Returns the block height of the latest meta-block that has been
     *         committed.
     *
     * @dev A meta-block has been committed if it has been proposed and the
     *      votes have been verified.
     *
     * @return The height of the latest committed meta-block.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256);

    /**
     * @notice Get the state root of a meta-block.
     *
     * @param _blockHeight For which block height to get the state root.
     *
     * @return The state root of the meta-block.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_);

    /**
     * @notice Get next accumulated gas target.
     *
     * @return Accumulated gas target.
     */
    function getAccumulateGasTarget()
        external
        view
        returns (uint256 accumulateGasTarget_);
}
