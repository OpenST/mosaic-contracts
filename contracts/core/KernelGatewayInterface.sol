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

/** @title The interface for the kernel gateway on auxiliary. */
interface KernelGatewayInterface {

    /**
     * @notice Prove the opening of a new meta-block on origin. The method will
     *         check the proof against the state root from the OriginBlockStore
     *         given the state trie branch.
     *
     * @param _height The height of this meta-block in the chain.
     * @param _parent The hash of this meta-block's parent.
     * @param _updatedValidators The array of addresses of the validators that
     *                           are updated within this block. Updated weights
     *                           at the same index relate to the address in
     *                           this array.
     * @param _updatedWeights The array of weights that corresponds to the
     *                        updated validators. Updated validators at the
     *                        same index relate to the weight in this array.
     *                        Weights of existing validators can only decrease.
     * @param _auxiliaryBlockHash The auxiliary block hash that was used for
     *                            closing the meta-block
     * @param _storageBranchRlp The trie branch of the state trie of origin
     *                            that proves that the opening took place on
     *                            origin.
     * @param _accountBranchRlp RLP encoded path from root node to leaf node to
     *                          prove account in merkle tree.
     * @param _originBlockHeight The block height on origin where the opening
     *                           took place. Must be a height that is finalised
     *                           in the OriginBlockStore.
     *
     * @return success_ `true` if the proof succeeded.
     */
    function proveBlockOpening(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights,
        bytes32 _auxiliaryBlockHash,
        bytes _storageBranchRlp,
        bytes _accountRlp,
        bytes _accountBranchRlp,
        uint256 _originBlockHeight
    )
        public
        returns (bool success_);

    /**
     * @notice Get open kernel hash for the activation height
     *
     * @param _activationHeight The activation auxiliary dynasty height.
     *
     * @return bytes32 kernel hash
     */
    function getOpenKernelHash(uint256 _activationHeight)
        external
        returns (bytes32 kernelHash_);

    /**
     * @notice Update the active kernel. This can be called only by the
     *         auxiliary block store when the activation dynasty height is
     *         reached
     *
     * @param _kernelHash The kernel hash.
     *
     * @return bool `true` when the kernel hash is active.
     */
    function activateKernel(bytes32 _kernelHash)
        external
        returns (bool success_);

    /**
     * @notice Get the updated validator addresses and validator weights for
     *         the given kernel hash
     *
     * @param _kernelHash The kernel hash.
     *
     * @return updatedValidators_ Updated validator addresses
     * @return updatedWeights_ Updated validator weights
     */
    function getUpdatedValidators(bytes32 _kernelHash)
        external
        returns (
            address[] updatedValidators_,
            uint256[] updatedWeights_
        );

    /**
     * @notice Get the active kernel hash.
     *
     * @return kernelHash_ Active kernel hash
     */
    function getActiveKernelHash()
        external
        returns (bytes32 kernelHash_);

}
