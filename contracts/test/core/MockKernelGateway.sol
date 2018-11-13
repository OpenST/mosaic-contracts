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

import "../../core/KernelGateway.sol";
import "../MockProofResults.sol";

/** @title The Mock kernel gateway on auxiliary. */
contract MockKernelGateway is KernelGateway{

    /** Used for mocking the results of merkle proof. */
    MockProofResults mockResult;

    /* Constructor */

    /**
     * @notice Initializes the contract with origin and auxiliary block store
     *         addresses.
     *
     * @param _originCore The address of OriginCore contract.
     * @param _originBlockStore The block store that stores the origin chain.
     * @param _auxiliaryBlockStore The block store that stores the auxiliary
     *                             chain.
     * @param _kernelHash Initial kernel hash.
     */
    constructor (
        address _originCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore,
        bytes32 _kernenlHash
    )
        KernelGateway(
            _originCore,
            _originBlockStore,
            _auxiliaryBlockStore,
            _kernenlHash
        )
        public
    {
        mockResult = new MockProofResults();
    }

    /**
     * @notice Set the mock result for the given set of inputs.
     *
     * @param _value The terminating value in the trie.
     * @param _encodedPath The path in the trie leading to value.
     * @param _rlpParentNodes The rlp encoded stack of nodes.
     * @param _root The root hash of the trie.
     * @param _result The value that is expected to return when `verify`
     *                function is called with these set of input params
     */
    function setResult (
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root,
        bool _result
    )
        external
    {
        mockResult.setResult(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root,
            _result
        );
    }

    /**
     * @notice Mocks the verify function of merkle patricia proof.
     *
     * @param _value The terminating value in the trie.
     * @param _encodedPath The path in the trie leading to value.
     * @param _rlpParentNodes The rlp encoded stack of nodes.
     * @param _root The root hash of the trie.
     *
     * @return success_ The mocked boolean result
     */
    function verify(
        bytes32 _value,
        bytes _encodedPath,
        bytes _rlpParentNodes,
        bytes32 _root
    )
        internal
        view
        returns (bool success_)
    {
        success_ =  mockResult.verify(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );
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
        address[] _updatedValidators,
        uint256[] _updatedWeights,
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

}
