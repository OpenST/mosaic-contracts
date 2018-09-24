pragma solidity ^0.4.24;

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

    /**
     * The transition object about the origin chain. It differs from the
     * transition object about the auxiliary chain, as not all data of an
     * auxiliary transition is known for origin.
     */
    struct OriginTransition {
        /**
         * The dynasty of the transition is the dynasty of the source block of
         * the finalisation vote that produces this transition.
         */
        uint256 dynasty;

        /** Block hash of the source block of the finalisation vote. */
        bytes32 blockHash;

        /**
         * The core identifier indentifies which chain this transition object
         * belongs to.
         */
        bytes20 coreIdentifier;
    }

    /** To hash structs according to EIP-712, a type hash is required. */
    bytes32 constant ORIGINTRANSITION_TYPEHASH = keccak256(
        "OriginTransition(uint256 dynasty,bytes32 blockHash,bytes20 coreIdentifier)"
    );

    /**
     * @notice
     *
     * @param _dynasty The dynasty of the origin transition object.
     * @param _blockHash The block hash of the origin transition object.
     * @param _coreIdentifier The core identifier of the origin transition
     *                        object.
     *
     * @return The hash of this transition object.
     */
    function hashOriginTransition(
        uint256 _dynasty,
        bytes32 _blockHash,
        bytes20 _coreIdentifier
    )
        external
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                ORIGINTRANSITION_TYPEHASH,
                _dynasty,
                _blockHash,
                _coreIdentifier
            )
        );
    }
}
