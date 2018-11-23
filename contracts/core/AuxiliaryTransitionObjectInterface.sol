pragma solidity ^0.5.0;

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

/** @title The interface for the transition object on auxiliary. */
interface AuxiliaryTransitionObjectInterface {

    /**
     * @notice Returns auxiliary transition hash at the checkpoint defined
     *         at given block hash.
     *
     * @param _blockHash The hash of the block for which transition object
     *                   is requested.
     *
     * @return transitionHash_ Hash of transition object at the checkpoint.
     */
    function auxiliaryTransitionHashAtBlock(
        bytes32 _blockHash
    )
        external
        view
        returns(bytes32 transitionHash_);

    /**
     * @notice Returns auxiliary transition object at the checkpoint defined
     *         at given block hash.
     *
     * @param _blockHash The hash of the block for which transition object
     *                   is requested.
     *
     * @return coreIdentifier_ The core identifier identifies the chain that
     *                         this block store is tracking.
     * @return kernelHash_  The hash of the current open meta-block kernel.
     * @return auxiliaryDynasty_ The dynasty number of auxiliary chain.
     * @return auxiliaryBlockHash_ The block hash where the meta-block possibly
                                   closes on the auxiliary chain.
     * @return accumulatedGas_ The total consumed gas on auxiliary chain.
     * @return originDynasty_ Dynasty of origin block within latest meta-block
     *                        reported at auxiliary chain.
     * @return originBlockHash_ Block hash of origin block within latest
     *                          meta-block reported at auxiliary chain.
     * @return transactionRoot_ The root of trie created by the auxiliary block
                                store from the transaction roots of all blocks.
     */
    function auxiliaryTransitionObjectAtBlock(
        bytes32 _blockHash
    )
        external
        view
        returns(
            bytes20 coreIdentifier_,
            bytes32 kernelHash_,
            uint256 auxiliaryDynasty_,
            bytes32 auxiliaryBlockHash_,
            uint256 accumulatedGas_,
            uint256 originDynasty_,
            bytes32 originBlockHash_,
            bytes32 transactionRoot_
        );
}
