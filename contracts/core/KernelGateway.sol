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

import "../lib/RLP.sol";
import "./BlockStoreInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/BytesLib.sol";
import "../lib/SafeMath.sol";
import "../lib/MetaBlock.sol";
import "./AuxiliaryTransitionObjectInterface.sol";
import "./KernelGatewayInterface.sol";

/** @title The kernel gateway on auxiliary. */
contract KernelGateway is KernelGatewayInterface {
    using SafeMath for uint256;

    /* Events */

    /** Emit event when open kernel in origin core is proven. */
    event OpenKernelProven(
        bytes20 _originCoreIdentifier,
        bytes20 _auxiliaryCoreIdentifier,
        uint256 _metaBlockHeight,
        bytes32 _parent,
        bytes32 _kernelHash,
        uint256 _activationDynasty
    );

    /** Emit event when proven open kernel is confirmed in auxiliary. */
    event OpenKernelConfirmed(
        bytes20 _originCoreIdentifier,
        bytes20 _auxiliaryCoreIdentifier,
        bytes32 _kernelHash,
        uint256 _currentDynasty
    );

    /** Emit event origin core account is proven. */
    event OriginCoreProven(
        address _originCore,
        uint256 _blockHeight,
        bytes32 _storageRoot,
        bool _wasAlreadyProved
    );

    /** Index of kernel hash storage location in origin core. */
    uint8 public constant KERNEL_HASH_INDEX = 5;

    /* Variables */

    /** Address of origin core. */
    address public originCore;

    /** Address of the origin block store. */
    BlockStoreInterface public originBlockStore;

    /** Address of the auxiliary block store. */
    BlockStoreInterface public auxiliaryBlockStore;

    /** path to prove merkle account proof for OriginCore contract. */
    bytes public encodedOriginCorePath;

    /** Storage path. */
    bytes public storagePath;

    /** A mapping of kernel hash to the kernel object. */
    mapping(bytes32 => MetaBlock.Kernel) public kernels;

    /** A mapping of origin block height to the storage root of origin core. */
    mapping(uint256 => bytes32) public storageRoots;

    /** The hash of the currently active kernel. */
    bytes32 private activeKernelHash;

    /** The hash of the open kernel. */
    bytes32 public openKernelHash;

    /** The auxiliary dynasty height at which the open kernel will be active. */
    uint256 public openKernelActivationHeight;

    /** The origin core identifier. */
    bytes20 public originCoreIdentifier;

    /** The auxiliary core identifier. */
    bytes20 public auxiliaryCoreIdentifier;

    /* Modifiers */

    /**
     * @notice Functions with this modifier can only be called from the address
     *         that is registered as the auxiliary block store.
     */
    modifier onlyAuxiliaryBlockStore() {
        require(
            msg.sender == address(auxiliaryBlockStore),
            "This method must be called from the registered auxiliary block store."
        );
        _;
    }

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
        bytes32 _kernelHash
    )
        public
    {
        require(
            _originCore != address(0),
            "The address of the origin core must not be zero."
        );

        require(
            address(_originBlockStore) != address(0),
            "The address of the origin block store must not be zero."
        );

        require(
            address(_auxiliaryBlockStore) != address(0),
            "The address of the auxiliary block store must not be zero."
        );

        require(
            _kernelHash != bytes32(0),
            "Kernel hash must not be zero."
        );

        originBlockStore = _originBlockStore;
        auxiliaryBlockStore = _auxiliaryBlockStore;
        originCore = _originCore;
        activeKernelHash = _kernelHash;
        originCoreIdentifier = originBlockStore.getCoreIdentifier();
        auxiliaryCoreIdentifier = auxiliaryBlockStore.getCoreIdentifier();

        address[] memory updatedValidators;
        uint256[] memory updatedWeights;

        kernels[activeKernelHash] = MetaBlock.Kernel(
            1,
            bytes32(0),
            updatedValidators,
            updatedWeights
        );

        bytes memory indexBytes = BytesLib.leftPad(
            BytesLib.bytes32ToBytes(bytes32(uint256(KERNEL_HASH_INDEX)))
        );

        storagePath = BytesLib.bytes32ToBytes(
            keccak256(abi.encodePacked(indexBytes))
        );

        encodedOriginCorePath = BytesLib.bytes32ToBytes(
            keccak256(abi.encodePacked(_originCore))
        );
    }

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
        returns (bool success_)
    {

        require(
            _accountRlp.length > 0,
            "The RLP encoded account must not be zero."
        );

        require(
            _accountBranchRlp.length > 0,
            "The RLP encoded account node path must not be zero."
        );

        bytes32 stateRoot = originBlockStore.stateRoot(_originBlockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "The State root must not be zero."
        );

        // If account already proven for block height
        bytes32 storageRoot = storageRoots[_originBlockHeight];

        bool isAlreadyProven = false;

        if (storageRoot != bytes32(0)) {

            isAlreadyProven = true;

        } else {

            storageRoot = updateStorageRoot(
                _accountRlp,
                _accountBranchRlp,
                encodedOriginCorePath,
                stateRoot,
                _originBlockHeight
            );
        }

        emit OriginCoreProven(
            originCore,
            _originBlockHeight,
            storageRoot,
            isAlreadyProven
        );

        success_ = true;

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
     *                            closing the previous meta-block.
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
        returns (bool success_)
    {
        // Check if a kernel is already opened and not yet consumed.
        require(
            openKernelHash == bytes32(0),
            "Existing open kernel is not activated."
        );

        require(
            _updatedValidators.length == _updatedWeights.length,
            "The lengths of the addresses and weights arrays must be identical."
        );

        require(
            originBlockStore.latestBlockHeight() >= _originBlockHeight,
            "The block containing the state root must be finalized."
        );

        require(
            _storageBranchRlp.length > 0,
            "The storage branch rlp must not be zero."
        );

        require(
            _parent != bytes32(0),
            "Parent hash must not be zero."
        );

        require(
            _auxiliaryBlockHash != bytes32(0),
            "Auxiliary block hash must not be zero."
        );

        bytes32 kernelHash = MetaBlock.hashKernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        validateKernel(
            _height,
            _parent,
            kernelHash,
            _auxiliaryBlockHash
        );

        bytes32 storageRoot = storageRoots[_originBlockHeight];

        // Storage root should be present.
        require(
            storageRoot != bytes32(0),
            "The storage root must not be zero."
        );

        /* Verify merkle proof for the existence of data */
        require(
            verify(
                keccak256(abi.encodePacked(kernelHash)),
                storagePath,
                _storageBranchRlp,
                storageRoot
            ),
            "Storage proof must be verified."
        );

        // Store the new kernel object.
        kernels[kernelHash] = MetaBlock.Kernel(
            _height,
            _parent,
            _updatedValidators,
            _updatedWeights
        );

        // Store the activation height for the reported kernel.
        openKernelActivationHeight =
            auxiliaryBlockStore.getCurrentDynasty().add(2);

        // Store the kernel hash for activation
        openKernelHash = kernelHash;

        emit OpenKernelProven(
            originCoreIdentifier,
            auxiliaryCoreIdentifier,
            _height,
            _parent,
            kernelHash,
            auxiliaryBlockStore.getCurrentDynasty().add(2)
        );

        success_ = true;

    }

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
     * @return bytes32 kernel hash.
     */
    function getOpenKernelHash(
        uint256 _activationHeight
    )
        external
        view
        returns (bytes32 kernelHash_)
    {
        if(openKernelActivationHeight == _activationHeight &&
            openKernelHash != bytes32(0)) {
            kernelHash_ = openKernelHash;
        }
    }

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
        )
    {
        if(openKernelHash != bytes32(0)) {
            kernelHash_ = openKernelHash;
            activationHeight_ = openKernelActivationHeight;
            MetaBlock.Kernel storage kernel = kernels[kernelHash_];
            updatedValidators_ = kernel.updatedValidators;
            updatedWeights_ = kernel.updatedWeights;
        }
    }

    /**
     * @notice Confirm the proved open kernel hash. This can be called only
     *         by the auxiliary block store when the activation(confirm)
     *         dynasty height is reached.
     *
     * @param _kernelHash The kernel hash.
     *
     * @return bool `true` when the kernel hash is confirmed.
     */
    function activateKernel(
        bytes32 _kernelHash
    )
        external
        onlyAuxiliaryBlockStore
        returns (bool success_)
    {
        require(
            _kernelHash == openKernelHash,
            "Kernel hash must be equal to open kernel hash"
        );

        // delete the kernel object.
        delete kernels[activeKernelHash];

        // Update the active kernel hash.
        activeKernelHash = openKernelHash;

        // delete the open kernel hash as its already activated.
        openKernelHash = bytes32(0);

        success_ = true;

        emit OpenKernelConfirmed(
            originCoreIdentifier,
            auxiliaryCoreIdentifier,
            _kernelHash,
            openKernelActivationHeight
        );

    }

    /**
     * @notice Get the updated validator addresses and validator weights for
     *         the given kernel hash.
     *
     * @param _kernelHash The kernel hash.
     *
     * @return updatedValidators_ Updated validator addresses.
     * @return updatedWeights_ Updated validator weights.
     */
    function getUpdatedValidators(
        bytes32 _kernelHash
    )
        external
        view
        returns (
            address[] memory updatedValidators_,
            uint256[] memory updatedWeights_
        )
    {
        MetaBlock.Kernel storage kernel = kernels[_kernelHash];
        updatedValidators_ = kernel.updatedValidators;
        updatedWeights_ = kernel.updatedWeights;
    }

    /**
     * @notice Get the active kernel hash.
     *
     * @return kernelHash_ Active kernel hash.
     */
    function getActiveKernelHash()
        external
        view
        returns (bytes32 kernelHash_)
    {
        kernelHash_ = activeKernelHash;
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
     * @return bytes32 Storage path of the variable.
     */
    function getStorageRoot(
        bytes memory _accountRlp,
        bytes memory _accountBranchRlp,
        bytes storage _encodedPath,
        bytes32 _stateRoot
    )
        internal
        pure
        returns (bytes32 storageRoot_)
    {
        // Decode RLP encoded account value.
        RLP.RLPItem memory accountItem = RLP.toRLPItem(_accountRlp);

        // Convert to list.
        RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);

        // Array 3rd position is storage root.
        storageRoot_ = RLP.toBytes32(accountArray[2]);

        bytes32 hashedAccount = keccak256(
            abi.encodePacked(_accountRlp)
        );

        /*
         * Verify the remote origin core contract against the committed state
         * root with the state trie Merkle proof.
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
     * @notice Prove the account and update the storage root for the given
     *         block height.
     *
     * @dev The existence of storage root is proved with merkle proof.
     *
     * @param _accountRlp rlp encoded data of account.
     * @param _accountBranchRlp RLP encoded path from root node to leaf node
     *                           to prove account in merkle tree.
     * @param _encodedPath Encoded path to search account node in merkle tree.
     * @param _stateRoot State root for given block height.
     * @param _blockHeight Block height for which the storage roots needs to
     *                     be updated.
     *
     * @return bytes32 Storage path of the variable.
     */
    function updateStorageRoot(
        bytes memory _accountRlp,
        bytes memory _accountBranchRlp,
        bytes storage _encodedPath,
        bytes32 _stateRoot,
        uint256 _blockHeight
    )
        internal
        returns (bytes32 storageRoot_)
    {
        storageRoot_ = getStorageRoot(
            _accountRlp,
            _accountBranchRlp,
            _encodedPath,
            _stateRoot
        );

        require(
            storageRoot_ != bytes32(0),
            "The storage root must not be zero."
        );

        storageRoots[_blockHeight] = storageRoot_;
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
        bytes memory _encodedPath,
        bytes memory _rlpParentNodes,
        bytes32 _root
    )
        internal
        pure
        returns (bool success_)
    {
        success_ =  MerklePatriciaProof.verify(
            _value,
            _encodedPath,
            _rlpParentNodes,
            _root
        );
    }

    /**
     * @notice Get current meta-block hash. For the given block hash get the
     *         transition hash. meta-block hash is hash of active kernel hash
     *         and auxiliary transition hash.
     *
     * @param _blockHash The auxiliary block hash that was used for closing the
     *                   previous meta-block.
     *
     * @return metaBlockHash_ The meta-block hash.
     */
    function currentMetaBlockHash(
        bytes32 _blockHash
    )
        internal
        view
        returns (bytes32 metaBlockHash_)
    {
        bytes32 transitionHash =
            AuxiliaryTransitionObjectInterface(address(auxiliaryBlockStore))
                .auxiliaryTransitionHashAtBlock(_blockHash);

        metaBlockHash_ = MetaBlock.hashMetaBlock(
            activeKernelHash,
            transitionHash
        );
    }

    /**
     * @notice Validate the new open kernel params.
     *
     * @param _height The height of this meta-block in the chain.
     * @param _parent The hash of this meta-block's parent.
     * @param _kernelHash The kernel hash.
     * @param _auxiliaryBlockHash The auxiliary block hash that was used for
     *                            closing the meta-block.
     */
    function validateKernel(
        uint256 _height,
        bytes32 _parent,
        bytes32 _kernelHash,
        bytes32 _auxiliaryBlockHash
    )
        private
        view
    {
        require(
            kernels[_kernelHash].height == 0,
            "Kernel must not exist."
        );

        // Get the active kernel object
        MetaBlock.Kernel storage prevKernel = kernels[activeKernelHash];

        /*
         * Check if the height of the new reported kernel is plus 1 to height
         * of active kernel.
         */
        require(
            _height == prevKernel.height.add(1),
            "Kernel height must be equal to open kernel height plus 1."
        );

        /*
         * Check if the parent of reported kernel is equal to the committed
         * meta-block hash.
         */
        require(
            _parent == currentMetaBlockHash(_auxiliaryBlockHash),
            "Parent hash must be equal to previous meta-block hash."
        );
    }

}
