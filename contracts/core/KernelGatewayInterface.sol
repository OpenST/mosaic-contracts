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

/** @title The interface for the kernel gateway on auxiliary. */
interface KernelGatewayInterface {

    /**
     * @notice Prove origin core account and update the latest storage root of
     *         origin core. This function will validate the proof against the
     *         state root from the OriginBlockStore
     *
     * @param _accountRlp RLP encoded account data.
     * @param _accountBranchRlp RLP encoded path from root node to leaf node to
     *                          prove account in merkle tree.
     * @param _originBlockHeight The block height on origin where the opening
     *                           took place. Must be a height that is finalised
     *                           in the OriginBlockStore.
     *
     * @return success_ `true` if the proof is successful.
     */
    function proveOriginCore(
        bytes calldata _accountRlp,
        bytes calldata _accountBranchRlp,
        uint256 _originBlockHeight
    )
        external
        returns (bool success_);

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
     * @param _originBlockHeight The block height on origin where the opening
     *                           took place. Must be a height that is finalised
     *                           in the OriginBlockStore.
     *
     * @return success_ `true` if the proof succeeded.
     */
    function proveBlockOpening(
        uint256 _height,
        bytes32 _parent,
        address[] calldata _updatedValidators,
        uint256[] calldata _updatedWeights,
        bytes32 _auxiliaryBlockHash,
        bytes calldata _storageBranchRlp,
        uint256 _originBlockHeight
    )
        external
        returns (bool success_);

    /**
     * @notice Get a proven kernel hash that should be confirmed at the given
     *         dynasty number.
     *
     * @dev Open kernel hash is the proven kernel hash which is not yet
     *      confirmed.
     *
     * @param _activationHeight The dynasty number at which the kernel hash
     *                          will be confirmed.
     *
     * @return bytes32 kernel hash
     */
    function getOpenKernelHash(uint256 _activationHeight)
        external
        view
        returns (bytes32 kernelHash_);

    /**
     * @notice Confirm the proved open kernel hash. This can be called only
     *         by the auxiliary block store when the activation(confirm)
     *         dynasty height is reached
     *
     * @param _kernelHash The kernel hash.
     *
     * @return bool `true` when the kernel hash is confirmed.
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
        view
        returns (
            address[] memory updatedValidators_,
            uint256[] memory updatedWeights_
        );

    /**
     * @notice Get the active kernel hash.
     *
     * @return kernelHash_ Active kernel hash.
     */
    function getActiveKernelHash()
        external
        view
        returns (bytes32 kernelHash_);

    /**
     * @notice Get a proven kernel hash, validator address and validator
     *         weights that is not yet confirmed
     *
     * @dev Open kernel hash is the proven kernel hash which is not yet
     *      confirmed.
     *
     * @return uint256 activation height.
     * @return bytes32 kernel hash.
     * @return address[] validator address.
     * @return uint256[] validator weights.
     */
    function getOpenKernel()
        external
        view
        returns (
            uint256 activationHeight_,
            bytes32 kernelHash_,
            address[] memory updatedValidators_,
            uint256[] memory updatedWeights_
        );

}
