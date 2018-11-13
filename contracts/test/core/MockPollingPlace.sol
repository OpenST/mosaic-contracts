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

import "../../core/BlockStoreInterface.sol";

/** @title The Mock polling place contract. */
contract MockPollingPlace {

    /** Auxiliary block store address. */
    BlockStoreInterface public auxiliaryBlockStore;

    /**
     * @notice Set the mock auxiliary block store address.
     *
     * @param _auxiliaryBlockStore Auxiliary block store contract address.
     */
    function setAuxiliaryBlockStore(BlockStoreInterface _auxiliaryBlockStore)
        external
    {
        auxiliaryBlockStore = _auxiliaryBlockStore;
    }

    /**
     * @notice Mock the behaviour of `updateMetaBlockHeight` function
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
     * @return `true` Mock result
     */
    function updateMetaBlockHeight(
        address[] _validators,
        uint256[] _weights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        external
        pure
        returns (bool success_)
    {
        success_ = true;
    }

    /**
     * @notice function `justify` in auxiliary block store can be called only
     *         by polling place. The auxiliary block store has to be a contract
     *         and cannot be a dummy address. This is because function
     *         `updateMetaBlockHeight` is called from auxiliary block store
     *         when justify is called. So this function is used to delegate the
     *         justify call from polling place.
     *
     * @param _sourceBlockHash The block hash of the source of the super-
     *                         majority link.
     * @param _targetBlockHash The block hash of the block that is justified.
     */
    function justify(
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        external
    {
        auxiliaryBlockStore.justify(_sourceBlockHash, _targetBlockHash);
    }

}
