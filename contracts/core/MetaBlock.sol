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

/** @title A meta-block of the meta-chain. */
library MetaBlock {

    /** The transition of a meta-block header. */
    struct Transition {

        /** A unique identifier that identifies what chain this vote is about. */
        bytes32 coreIdentifier;

        /** Hash of kernel of meta-block for given transition object. */
        bytes32 kernelHash;

        /** The dynasty of the auxiliary block with the above block hash. */
        uint256 auxiliaryDynasty;

        /**
         * The block hash of the last finalised checkpoint on auxiliary that is
         * contained within this meta-block. This block hash may be used to
         * prove state.
         */
        bytes32 auxiliaryBlockHash;

        /**
         * The total gas that has been consumed on auxiliary for all blocks
         * that are inside this meta-block.
         */
        uint256 gas;

         /**
          * Dynasty of origin block within latest meta-block
          * reported at auxiliary chain.
          */
        uint256 originDynasty;

        /**
         * Block hash of origin block within latest meta-block reported
         * at auxiliary chain.
         */
        bytes32 originBlockHash;
        /**
         * The transaction root of the meta-block. A trie created by the
         * auxiliary block store from the transaction roots of all blocks.
         */
        bytes32 transactionRoot;

        /**
         * The root hash of the state trie of the latest finalised checkpoint
         * on auxiliary that is part of this meta-block.
         */
        bytes32 stateRoot;
    }

    /**
     * @notice Takes the parameters of an transition object and returns the
     *         typed hash of it.
     *
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
     * @param _stateRoot The state root of the last finalised checkpoint
     *                            that is part of this meta-block.     *
     * @return The hash of this transition object.
     */
    function hashOriginTransition(
        bytes32 _coreIdentifier,
        bytes32 _kernelHash,
        uint256 _auxiliaryDynasty,
        bytes32 _auxiliaryBlockHash,
        uint256 _gas,
        uint256 _originDynasty,
        bytes32 _originBlockHash,
        bytes32 _transactionRoot,
        bytes32 _stateRoot
    )
        internal
        returns(bytes32)
    {
        revert("This method is not implemented.");
    }

    /**
     * @notice Takes the parameters of a kernel object and returns the
     *         typed hash of it.
     *
     * @param _height The height of meta-block.
     * @param _parent The hash of this block's parent.
     * @param _updatedValidators  The array of addresses of the validators.
     * @param _updatedWeights The array of weights that corresponds to
     *                        the updated validators.
     *
     * @return The hash of kernel.
     */
    function hashKernel(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights
    )
        internal
        returns(bytes32)
    {
        revert("This method is not implemented.");
    }

}
