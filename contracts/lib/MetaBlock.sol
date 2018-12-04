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

import "../lib/SafeMath.sol";

/** @title A meta-block of the meta-chain. */
library MetaBlock {
    using SafeMath for uint256;

    /** To hash structs according to EIP-712, a type hash is required. */
    bytes32 constant ORIGINTRANSITION_TYPEHASH = keccak256(
        "OriginTransition(uint256 dynasty,bytes32 blockHash,bytes20 coreIdentifier)"
    );

    /** To hash vote message according to EIP-712, a type hash is required. */
    bytes32 constant VOTEMESSAGE_TYPEHASH = keccak256(
        "VoteMessage(bytes20 coreIdentifier,bytes32 transitionHash,bytes32 source,bytes32 target,uint256 sourceHeight,uint256 targetHeight)"
    );

    /** To hash structs according to EIP-712, a type hash is required. */
    bytes32 constant AUXILIARYTRANSITION_TYPEHASH = keccak256(
        "AuxiliaryTransition(bytes20 coreIdentifier,bytes32 kernelHash,uint256 auxiliaryDynasty,bytes32 auxiliaryBlockHash,uint256 accumulatedGas,uint256 originDynasty,bytes32 originBlockHash,bytes32 transactionRoot)"
    );

    /** To hash structs according to EIP-712, a type hash is required. */
    bytes32 constant KERNEL_TYPEHASH = keccak256(
        "Kernel(uint256 height,bytes32 parent,address[] updatedValidators,uint256[] updatedWeights)"
    );

    /** To hash structs according to EIP-712, a type hash is required. */
    bytes32 constant METABLOCK_TYPEHASH = keccak256(
        "MetaBlock(bytes32 kernelHash,bytes32 transitionHash)"
    );

    /* Structs */

    /** The header of a meta-block. */
    struct Header {
        Kernel kernel;
        AuxiliaryTransition transition;
    }

    /** The kernel of a meta-block header. */
    struct Kernel {

        /** The height of this header's block in the chain. */
        uint256 height;

        /** The hash of this block's parent. */
        bytes32 parent;

        /**
         * The array of addresses of the validators that are updated within
         * this block. Updated weights at the same index relate to the address
         * in this array.
         */
        address[] updatedValidators;

        /**
         * The array of weights that corresponds to the updated validators.
         * Updated validators at the same index relate to the weight in this
         * array. Weights of existing validators can only decrease.
         */
        uint256[] updatedWeights;
    }

    /** The transition of a meta-block header. */
    struct AuxiliaryTransition {

        /** A unique identifier that identifies what chain this vote is about. */
        bytes20 coreIdentifier;

        /** Hash of kernel of meta-block for given transition object. */
        bytes32 kernelHash;

        /** The dynasty of the auxiliary block with the above block hash. */
        uint256 auxiliaryDynasty;

        /**
         * The block hash of the last finalized checkpoint on auxiliary that is
         * contained within this meta-block. This block hash may be used to
         * prove state.
         */
        bytes32 auxiliaryBlockHash;

        /**
         * The total gas that has been consumed on auxiliary for all blocks
         * since the meta-blockchain genesis.
         */
        uint256 accumulatedGas;

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
    }

    /**
     * The transition object about the origin chain. It differs from the
     * transition object about the auxiliary chain, as not all data of an
     * auxiliary transition is known for origin.
     */
    struct OriginTransition {
        /**
         * The dynasty of the transition is the dynasty of the source block of
         * the finalization vote that produces this transition.
         */
        uint256 dynasty;

        /** Block hash of the source block of the finalization vote. */
        bytes32 blockHash;

        /**
         * The core identifier identifies which chain this transition object
         * belongs to.
         */
        bytes20 coreIdentifier;
    }
    /**
     * Seal object which tracks vote of validators for a given transition hash.
     */
    struct Seal {
        /**
         * This tracks validators which have been added to this seal.
         */
        mapping(address => bool) validators;

        /** Sum of validator weights that have been added to this seal. */
        uint256 totalVoteWeight;
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
     * @param _accumulatedGas The total consumed gas on auxiliary within this
     *                        meta-block.
     * @param _originDynasty Dynasty of origin block within latest meta-block
     *                          reported at auxiliary chain.
     * @param _originBlockHash Block hash of origin block within latest
     *                          meta-block reported at auxiliary chain.
     * @param _transactionRoot The transaction root of the meta-block. A trie
     *                         created by the auxiliary block store from the
     *                         transaction roots of all blocks.
     * @return hash_ The hash of this transition object.
     */
    function hashAuxiliaryTransition(
        bytes20 _coreIdentifier,
        bytes32 _kernelHash,
        uint256 _auxiliaryDynasty,
        bytes32 _auxiliaryBlockHash,
        uint256 _accumulatedGas,
        uint256 _originDynasty,
        bytes32 _originBlockHash,
        bytes32 _transactionRoot
    )
        internal
        pure
        returns (bytes32 hash_)
    {
        hash_ = keccak256(
            abi.encode(
                AUXILIARYTRANSITION_TYPEHASH,
                _coreIdentifier,
                _kernelHash,
                _auxiliaryDynasty,
                _auxiliaryBlockHash,
                _accumulatedGas,
                _originDynasty,
                _originBlockHash,
                _transactionRoot
            )
        );
    }

    /**
     * @notice Takes the parameters of an origin transition and returns the
     *         typed hash of it.
     *
     * @param _dynasty The dynasty of the origin transition object.
     * @param _blockHash The block hash of the origin transition object.
     * @param _coreIdentifier The core identifier of the origin transition
     *                        object.
     *
     * @return hash_ The hash of this transition object.
     */
    function hashOriginTransition(
        uint256 _dynasty,
        bytes32 _blockHash,
        bytes20 _coreIdentifier
    )
        internal
        pure
        returns (bytes32 hash_)
    {
        hash_ = keccak256(
            abi.encode(
                ORIGINTRANSITION_TYPEHASH,
                _dynasty,
                _blockHash,
                _coreIdentifier
            )
        );
    }

    /**
     * @notice Creates the hash of vote.
     *
     * @param _coreIdentifier A unique identifier that identifies what chain
     *                        this vote is about.
     * @param _transition The hash of the transition part of the meta-block
     *                    header at the source block.
     * @param _source The hash of the source block.
     * @param _target The hash of the target block.
     * @param _sourceHeight The height of the source block.
     * @param _targetHeight The height of the target block.
     *
     * @return The hash of the given vote.
     */
    function hashVote(
        bytes20 _coreIdentifier,
        bytes32 _transition,
        bytes32 _source,
        bytes32 _target,
        uint256 _sourceHeight,
        uint256 _targetHeight
    )
        internal
        pure
        returns (bytes32 hashed_)
    {
        hashed_ = keccak256(
            abi.encodePacked(
                VOTEMESSAGE_TYPEHASH,
                _coreIdentifier,
                _transition,
                _source,
                _target,
                _sourceHeight,
                _targetHeight
            )
        );
    }

    /**
     * @notice Takes the parameters of a kernel object and returns the
     *         typed hash of it.
     *
     * @param _height The height of meta-block.
     * @param _parent The hash of this block's parent.
     * @param _updatedValidators  The array of addresses of the updated validators.
     * @param _updatedWeights The array of weights that corresponds to
     *                        the updated validators.
     *
     * @return hash_ The hash of kernel.
     */
    function hashKernel(
        uint256 _height,
        bytes32 _parent,
        address[] memory _updatedValidators,
        uint256[] memory _updatedWeights
    )
        internal
        pure
        returns (bytes32 hash_)
    {
        hash_ = keccak256(
            abi.encode(
                KERNEL_TYPEHASH,
                _height,
                _parent,
                _updatedValidators,
                _updatedWeights
            )
        );
    }

    /**
     * @notice Takes the parameters of a MetaBlock object and returns the
     *         typed hash of it.
     *
     * @param _kernelHash The hash of kernel.
     * @param _transitionHash The hash of transition object.
     *
     * @return hash_ The hash of meta-block.
     */
    function hashMetaBlock(bytes32 _kernelHash, bytes32 _transitionHash)
        internal
        pure
        returns(bytes32 hash_)
    {
        hash_ = keccak256(
            abi.encode(
                METABLOCK_TYPEHASH,
                _kernelHash,
                _transitionHash
            )
        );
    }

    /**
     * @notice Function to calculated weight required for super majority
     *         i.e 2/3rd of total weight.
     *
     * @param _totalWeight Total weight of all the validators at current
     *                     meta-block height.
     *
     * @return requiredWeight_ Required weight for 2/3rd super majority.
     */
    function requiredWeightForSuperMajority(uint256 _totalWeight)
        internal
        pure
        returns(uint256 requiredWeight_)
    {
        // 2/3 are required (a supermajority).
        requiredWeight_ = _totalWeight.mul(2).div(3);

        /*
         * Solidity always rounds down, but we have to round up if there is a
         * remainder. It has to be *at least* 2/3.
         */
        if (_totalWeight.mul(2).mod(3) > 0) {
            requiredWeight_ = requiredWeight_.add(1);
        }
    }
}

