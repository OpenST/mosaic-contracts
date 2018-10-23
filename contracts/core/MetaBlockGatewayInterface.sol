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

/** @title The interface for the meta-block Gateway on auxiliary. */
interface MetaBlockGatewayInterface {

    /**
     * @notice Prove the opening of a new meta-block on origin. The method will
     *         check the proof against the state root from the OriginBlockStore
     *         given the state trie branch.
     *
     * @param _metaBlockHeaderRlp The entire new meta-block header, RLP encoded.
     * @param _stateTrieBranchRlp The trie branch of the state truie of origin
     *                            that proves that the opening took place on
     *                            origin.
     * @param _originBlockHeight The block height on origin where the opening
     *                           took place. Must be a height that is finalised
     *                           in the OriginBlockStore.
     *
     * @return `true` if the proof succeeded.
     */
    function proveBlockOpening(
        bytes _metaBlockHeaderRlp,
        bytes _stateTrieBranchRlp,
        uint256 _originBlockHeight
    )
        external
        returns (bool success_);
}
