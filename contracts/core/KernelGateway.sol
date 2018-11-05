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

import "../lib/RLP.sol";
import "./BlockStoreInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/BytesLib.sol";
import "../lib/SafeMath.sol";
import "./ReportOpenKernelInterface.sol";

/** @title The kernel gateway on auxiliary. */
contract KernelGateway {

    /* Events */
    event OpenKernelProven(
        bytes20 _originCoreIdentifier,
        bytes20 _auxiliaryCoreIdentifier,
        uint256 _metaBlockHeight,
        bytes32 _parent,
        bytes32 _kernelHash,
        uint256 _activationDynasty
    );

    using SafeMath for uint256;

    /** Index of kernel hash storage location in origin core */
    uint8 constant KERNEL_HASH_INDEX = 5;

    /* Variables */

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
        returns (bool success_)
    {
        require(
            _parent != bytes32(0),
            "Parent hash must not be zero."
        );

        require(
            _auxiliaryBlockHash != bytes32(0),
            "Auxiliary block hash must not be zero."
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

        bytes32 kernelHash =
            ReportOpenKernelInterface(auxiliaryBlockStore).reportOpenKernel(
                _height,
                _parent,
                _updatedValidators,
                _updatedWeights,
                _auxiliaryBlockHash
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

        emit OpenKernelProven(
            originBlockStore.getCoreIdentifier(),
            auxiliaryBlockStore.getCoreIdentifier(),
            _height,
            _parent,
            kernelHash,
            auxiliaryBlockStore.getCurrentDynasty().add(2)
        );

        success_ = true;

    }

    /* Internal functions */

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

    /**
     * @notice Perform the merkle proof.
     *
     * @param _value The terminating value in the trie.
     * @param _encodedPath The path in the trie leading to value.
     * @param _rlpParentNodes The rlp encoded stack of nodes.
     * @param _root The root hash of the trie.
     *
     * @return success_ The boolean validity of the proof.
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
        success_ =  MerklePatriciaProof.verify(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );
    }

}
