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

import "./KernelGatewayInterface.sol";
import "../lib/MetaBlock.sol";
import "../lib/RLP.sol";
import "./BlockStoreInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/BytesLib.sol";
import "../lib/SafeMath.sol";

/** @title The kernel gateway on auxiliary. */
contract KernelGateway is KernelGatewayInterface {

    using SafeMath for uint256;

    uint8 constant KERNEL_HASH_INDEX = 5;

    /** Address of origin core */
    address public originCore;

    /** Address of the origin block store */
    BlockStoreInterface public originBlockStore;

    /** Address of the auxiliary block store */
    BlockStoreInterface public auxiliaryBlockStore;

    /** path to prove merkle account proof for OriginCore contract. */
    bytes public encodedOriginCorePath;

    /** Storage path. */
    bytes public storagePath;

    /** Open kernel hash. */
    bytes32 public openKernelHash;

    /** Open kernel . */
    MetaBlock.Kernel public openKernel;

    /* Constructor */

    /**
     * @notice Initializes the contract with origin and auxiliary block store
     *         addresses
     *
     * @param _originCore The address of OriginCore contract.
     * @param _originBlockStore The block store that stores the origin chain.
     * @param _auxiliaryBlockStore The block store that stores the auxiliary
     *                             chain.
     */
    constructor (
        address _originCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore
    )
        public
    {
        require(
            _originCore != address(0),
            "The address of the origin core must not be zero."
        );

        require(
            _originBlockStore != address(0),
            "The address of the origin block store must not be zero."
        );

        require(
            _auxiliaryBlockStore != address(0),
            "The address of the auxiliary block store must not be zero."
        );

        originBlockStore = _originBlockStore;
        auxiliaryBlockStore = _auxiliaryBlockStore;
        originCore = _originCore;


        bytes memory indexBytes = BytesLib.leftPad(
            BytesLib.bytes32ToBytes(bytes32(KERNEL_HASH_INDEX))
        );

        storagePath = BytesLib.bytes32ToBytes(
            keccak256(abi.encodePacked(indexBytes))
        );

        encodedOriginCorePath = BytesLib.bytes32ToBytes(
            keccak256(abi.encodePacked(_originCore))
        );
    }

    /* External functions */

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
        bytes _storageBranchRlp,
        bytes _accountRlp,
        bytes _accountBranchRlp,
        uint256 _originBlockHeight
    )
        public
        returns (bool success_)
    {
        require(
            _parent != bytes32(0),
            "Parent hash must not be zero."
        );

        require(
            _updatedValidators.length == _updatedWeights.length,
            "The lengths of the addresses and weights arrays must be identical."
        );

        require(
            _storageBranchRlp.length > 0,
            "The storage branch rlp must not be zero."
        );

        require(
            _accountRlp.length > 0,
            "The RLP encoded account must not be zero."
        );

        require(
            _accountBranchRlp.length > 0,
            "The RLP encoded account node path must not be zero."
        );

        require(
            originBlockStore.latestBlockHeight() >= _originBlockHeight,
            "The block containing the state root must be finalized."
        );

        require(
            _height == openKernel.height.add(1),
            "Kernel height must be equal to open kernal height plus 1."
        );

        require(
            _parent == openKernelHash,
            "Parent hash must be equal to open kernel hash."
        );

        bytes32 stateRoot = originBlockStore.stateRoot(_originBlockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "The State root must not be zero."
        );

        bytes32 storageRoot = getStorageRoot(
            _accountRlp,
            _accountBranchRlp,
            encodedOriginCorePath,
            stateRoot
        );

        bytes32 kernelHash = MetaBlock.hashKernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        /**
         * Verify merkle proof for the existence of data
         */
        require(
            verify(
                keccak256(abi.encodePacked(kernelHash)),
                storagePath,
                _storageBranchRlp,
                storageRoot
            ),
            "Storage proof must be verified."
        );

        openNewKernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        success_ = true;


    }

    /**
     * @notice Get storage root for the OriginCore contract.
     *
     * @dev The existence of storage root is proved with merkle proof.
     *
     * @param _accountRlp rlp encoded data of account.
     * @param _accountBranchRlp RLP encoded path from root node to leaf node
     *                           to prove account in merkle tree.
     * @param _encodedPath Encoded path to search account node in merkle tree.
     * @param _stateRoot State root for given block height.
     *
     * @return bytes32 Storage path of the variable
     */
    function getStorageRoot(
        bytes _accountRlp,
        bytes _accountBranchRlp,
        bytes _encodedPath,
        bytes32 _stateRoot
    )
        internal
        view
        returns (bytes32 storageRoot_)
    {
        // Decode RLP encoded account value
        RLP.RLPItem memory accountItem = RLP.toRLPItem(_accountRlp);

        // Convert to list
        RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);

        // Array 3rd position is storage root
        storageRoot_ = RLP.toBytes32(accountArray[2]);

        // Hash the rlpEncodedValue value
        bytes32 hashedAccount = keccak256(
            abi.encodePacked(_accountRlp)
        );

        /*
         * Verify the remote origin core contract against the committed state
         * root with the state trie Merkle proof
         */
        require(
            verify(
                hashedAccount,
                _encodedPath,
                _accountBranchRlp,
                _stateRoot
            ),
            "Account is not verified."
        );

        return storageRoot_;
    }

    function getValidators()
        external
        view
        returns(address[] updatedValidators_)
    {
        updatedValidators_ = openKernel.updatedValidators;
    }

    function getValidatorWeights()
        external
        view
        returns(uint256[] updatedWeights_)
    {
        updatedWeights_ = openKernel.updatedWeights;
    }

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
        success_ =  MerklePatriciaProof.verify(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );
    }

    function openNewKernel(
        uint256 _height,
        bytes32 _parent,
        address[] _updatedValidators,
        uint256[] _updatedWeights
    )
        private
    {
        openKernel = MetaBlock.Kernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        openKernelHash = MetaBlock.hashKernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );
    }
}
