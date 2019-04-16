pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../../core/KernelGateway.sol";

/** @title The Test kernel gateway on auxiliary. */
contract TestKernelGateway is KernelGateway{

    /* Constructor */

    /**
     * @notice Initializes the contract with origin and auxiliary block store
     *         addresses.
     *
     * @param _mosaicCore The address of MosaicCore contract.
     * @param _originBlockStore The block store that stores the origin chain.
     * @param _auxiliaryBlockStore The block store that stores the auxiliary
     *                             chain.
     * @param _kernelHash Initial kernel hash.
     */
    constructor (
        address _mosaicCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore,
        bytes32 _kernelHash
    )
        KernelGateway(
            _mosaicCore,
            _originBlockStore,
            _auxiliaryBlockStore,
            _kernelHash
        )
        public
    {

    }

    /**
    * @notice Mocks the verify function of merkle patricia proof.
    *
    * @return success_ `true` to mock the failing scenario.
    */
    function verify(
        bytes32,
        bytes memory,
        bytes memory,
        bytes32
    )
        internal
        pure
        returns (bool success_)
    {
        success_ = true;
    }

    /**
     * @notice Set the mock kernel hash data.
     *
     * @param _kernelHash The mock kernel hash.
     */
    function setOpenKernelHash(bytes32 _kernelHash) external {
        openKernelHash = _kernelHash;
    }

    /**
     * @notice Set the mock activation height.
     *
     * @param _activationHeight The mock activation height.
     */
    function setOpenKernelActivationHeight(uint256 _activationHeight) external {
        openKernelActivationHeight = _activationHeight;
    }

    /**
     * @notice Set the mock kernel data.
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
     * @param _kernelHash Mock kernel hash.
     */
    function setKernel(
        uint256 _height,
        bytes32 _parent,
        address[] calldata _updatedValidators,
        uint256[] calldata _updatedWeights,
        bytes32 _kernelHash
    )
        external
    {
        kernels[_kernelHash] = MetaBlock.Kernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );
    }

    /**
     * @notice Set the mock storage root data.
     *
     * @param _storageRoot The mocked storage root value.
     * @param _blockHeight The block height for storage root.
     */
    function setStorageRoot(
        bytes32 _storageRoot,
        uint256 _blockHeight
    )
        external
    {
        storageRoots[_blockHeight] = _storageRoot;
    }
}
