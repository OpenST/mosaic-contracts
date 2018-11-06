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

import "../lib/Block.sol";
import "../lib/MetaBlock.sol";
import "../lib/SafeMath.sol";
import "./BlockStore.sol";
import "./PollingPlaceInterface.sol";
import "./KernelGatewayInterface.sol";
/**
 * @title The auxiliary block store stores observations about the auxiliary
 *        chain.
 */
contract AuxiliaryBlockStore is BlockStore {
    using SafeMath for uint256;

    /* Variables */

    /** A mapping of block hashes to their respective accumulated gas. */
    mapping(bytes32 => uint256) public accumulatedGases;

    /**
     * A mapping of block hashes to their respective accumulated transaction
     * root.
     */
    mapping(bytes32 => bytes32) public accumulatedTransactionRoots;

    /**
     * A mapping of auxiliary block hashes to the current origin dynasty at the
     * time of reporting the auxiliary block.
     */
    mapping(bytes32 => uint256) public originDynasties;

    /**
     * A mapping of auxiliary block hashes to the latest finalized origin block
     * hash at the time of reporting the auxiliary block.
     */
    mapping(bytes32 => bytes32) public originBlockHashes;

    /** A mapping of auxiliary block hash to the kernel hash */
    mapping(bytes32 => bytes32) public kernelHashes;

    /** The corresponding origin block store that tracks the origin chain. */
    BlockStore public originBlockStore;

    /**
     * The meta-block gate kernel gateway is the only contract that is allowed
     * to inform opening of new kernel gateway.
     */
    KernelGatewayInterface public kernelGateway;

    /* Modifiers */

    /**
     * @notice Functions with this modifier can only be called from the address
     *         that is registered as the kernel gateway.
     */
    modifier onlyKernelGateway() {
        require(
            msg.sender == address(kernelGateway),
            "This method must be called from the registered kernel gateway."
        );
        _;
    }

    /* Constructor */

    /**
     * @notice Construct a new block store. Requires the block hash, state
     *         root, and block height of an initial starting block. Depending
     *         on which chain this store tracks, this could be a different
     *         block than genesis.
     *
     * @param _coreIdentifier The core identifier identifies the chain that
     *                        this block store is tracking.
     * @param _epochLength The epoch length is the number of blocks from one
     *                     checkpoint to the next.
     * @param _pollingPlace The address of the polling place address. Only the
     *                      polling place may call the justify method.
     * @param _originBlockStore The address where the origin block store is
     *                          deployed. Required to get the latest
     *                          observations of origin for the transition hash.
     * @param _initialBlockHash The block hash of the initial starting block.
     * @param _initialStateRoot The state root of the initial starting block.
     * @param _initialBlockHeight The block height of the initial starting
     *                            block.
     * @param _initialGas The initial gas to start tracking the accumulated gas
     *                    from.
     * @param _initialTransactionRoot The initial transaction root to start
     *                                tracking the accumulated transaction root
     *                                from.
     */
    constructor (
        bytes20 _coreIdentifier,
        uint256 _epochLength,
        address _pollingPlace,
        address _originBlockStore,
        bytes32 _initialBlockHash,
        bytes32 _initialStateRoot,
        uint256 _initialBlockHeight,
        uint256 _initialGas,
        bytes32 _initialTransactionRoot
    )
        BlockStore(
            _coreIdentifier,
            _epochLength,
            _pollingPlace,
            _initialBlockHash,
            _initialStateRoot,
            _initialBlockHeight
        )
        public
    {
        require(
            _originBlockStore != address(0),
            "The given origin block store address must not be zero."
        );

        originBlockStore = BlockStore(_originBlockStore);
        accumulatedGases[_initialBlockHash] = _initialGas;
        accumulatedTransactionRoots[_initialBlockHash] = _initialTransactionRoot;
    }

    /* External Functions */

    /**
     * @notice Set kernel gateway
     *
     * @param _kernelGateway The kernel gateway address
     */
    function initializeKernelGateway(KernelGatewayInterface _kernelGateway)
        external
    {
        require(
            kernelGateway == address(0),
            "Kernel gateway must not be already initialized."
        );

        kernelGateway = _kernelGateway;
    }

    /**
     * @notice Report a block. A reported block header is stored and can then
     *         be part of subsequent votes.
     *
     * @param _blockHeaderRlp The header of the reported block, RLP encoded.
     */
    function reportBlock(
        bytes _blockHeaderRlp
    )
        external
        returns (bool success_)
    {
        Block.Header memory header = Block.decodeHeader(_blockHeaderRlp);

        require(
            super.isReported(header.parentHash),
            "The parent of a reported block must be reported first."
        );

        Block.Header storage parent = reportedBlocks[header.parentHash];
        require(
            parent.height == header.height.sub(1),
            "The parent must have a height of one below the reported header."
        );

        success_ = super.reportBlock_(header);

        if (success_) {
            accumulatedGases[header.blockHash] = accumulatedGases[parent.blockHash].add(
                header.gasUsed
            );

            accumulatedTransactionRoots[header.blockHash] = keccak256(
                abi.encode(
                    accumulatedTransactionRoots[parent.blockHash],
                    header.transactionRoot
                )
            );

            originDynasties[header.blockHash] = originBlockStore.getCurrentDynasty();
            originBlockHashes[header.blockHash] = originBlockStore.getHead();
        }
    }

    /**
     * @notice Get the transition hash for the given block hash.
     *
     * @dev The block hash should be for the checkpoints.
     *
     * @param _blockHash The auxiliary block hash
     *
     * @return transitionHash_ The transition hash
     */
    function getTransitionHash(
        bytes32 _blockHash
    )
        external
        view
        returns (bytes32 transitionHash_)
    {
        transitionHash_ = MetaBlock.hashAuxiliaryTransition(
            coreIdentifier,
            kernelHashes[_blockHash],
            checkpoints[_blockHash].dynasty,
            _blockHash,
            accumulatedGases[_blockHash],
            originDynasties[_blockHash],
            originBlockHashes[_blockHash],
            accumulatedTransactionRoots[_blockHash]
        );
    }

    /* Internal Functions */

    /**
     * @notice Checks if a target block is valid. The same criteria apply for
     *         voting and justifying, as justifying results from voting.
     *
     * @dev In addition to the general block store's check whether a target is
     *      valid, here it also has to be a descendant of the source block.
     *
     * @param _sourceBlockHash The hash of the corresponding source.
     * @param _targetBlockHash The hash of the potential target block.
     *
     * @return valid_ `true` if the given block hash is a valid target.
     * @return reason_ Gives the reason in case the block is not a valid target.
     */
    function isTargetValid(
        bytes32 _sourceBlockHash,
        bytes32 _targetBlockHash
    )
        internal
        view
        returns (bool valid_, string reason_)
    {
        (valid_, reason_) = super.isTargetValid(
            _sourceBlockHash,
            _targetBlockHash
        );

        if (
            valid_ &&
            !isAncestorCheckpoint(_sourceBlockHash, _targetBlockHash)
        ) {
            valid_ = false;
            reason_ = "The source must be an ancestor of the target.";
        }
    }

    /**
     * @notice Takes a transition hash and checks that the given checkpoint has
     *         the same transition hash.
     *
     * @param _transitionHash The hash to check.
     * @param _blockHash The checkpoint to test the hash against.
     *
     * @return `true` if the given checkpoint has the same transition hash.
     */
    function isValidTransitionHash(
        bytes32 _transitionHash,
        bytes32 _blockHash
    )
        internal
        view
        returns (bool valid_)
    {
        bytes32 expectedTransitionHash = MetaBlock.hashAuxiliaryTransition(
            coreIdentifier,
            kernelHashes[_blockHash],
            checkpoints[_blockHash].dynasty,
            _blockHash,
            accumulatedGases[_blockHash],
            originDynasties[_blockHash],
            originBlockHashes[_blockHash],
            accumulatedTransactionRoots[_blockHash]
        );

        valid_ = _transitionHash == expectedTransitionHash;
    }

    /**
     * @notice Finalises the checkpoint at the given block hash. Updates the
     *         current head and dynasty if it is above the old head.
     *
     * @param _blockHash The checkpoint that shall be finalized.
     */
    function finalise(bytes32 _blockHash) internal {

        uint256 existingDynasty = currentDynasty;

        super.finalise(_blockHash);

        if(currentDynasty == existingDynasty.add(1)){
            updateKernel(_blockHash);
        }
    }

    /* Private Functions */

    /**
     * @notice Checks whether there is a chain of blocks and checkpoints from
     *         the ancestor to the descendant. It first goes back from the
     *         descendant along blocks to the latest checkpoint. Then it
     *         continues along the list of checkpoints and checks whether it can
     *         reach the ancestor.
     *
     * @param _ancestor The block hash of the ancestor. Must be a justified
     *                  checkpoint.
     * @param _descendant The block hash of the descendant. Mist be a reported
     *                    block.
     *
     * @return isAncestor_ `true` if it finds a path from the descendant to the
     *                     ancestor.
     */
    function isAncestorCheckpoint(
        bytes32 _ancestor,
        bytes32 _descendant
    )
        private
        view
        returns (bool isAncestor_)
    {
        /*
         * Walk along list of blocks to closest checkpoint. The descendant is
         * not (yet) a justified checkpoint, so we first need to find the
         * closest (youngest) checkpoint.
         */
        Block.Header storage currentBlock = reportedBlocks[_descendant];
        while (
            checkpoints[currentBlock.blockHash].blockHash != currentBlock.blockHash
        ) {
            currentBlock = reportedBlocks[currentBlock.parentHash];
        }

        /*
         * Walk along list of checkpoints to correct height. This is more
         * efficient as it skips across blocks in between checkpoints.
         */
        Checkpoint storage currentCheckpoint = checkpoints[currentBlock.blockHash];
        while (
            reportedBlocks[currentCheckpoint.blockHash].height > reportedBlocks[_ancestor].height
        ) {
            currentCheckpoint = checkpoints[currentCheckpoint.parent];
        }

        isAncestor_ = currentCheckpoint.blockHash == _ancestor;
    }

    /**
     * @notice Stores the kernel observation for the dynasty number.
     *         It also activates already reported kernel
     *
     * @param _blockHash The checkpoint that shall be finalized.
     */
    function updateKernel(bytes32 _blockHash)
        private
    {

        bytes32 openKernelHash =
            kernelGateway.getOpenKernelHash(currentDynasty);

        // Check if any kernel is reported for activation.
        if(openKernelHash != bytes32(0)) {

            address[] memory updatedValidators;
            uint256[] memory updatedWeights;

            (updatedValidators, updatedWeights) =
                kernelGateway.getUpdatedValidators(openKernelHash);

            /*
             * Report polling place about new validators and new finalized
             * block heights.
             */
            PollingPlaceInterface(pollingPlace).updateMetaBlockHeight(
                updatedValidators,
                updatedWeights,
                originBlockStore.getCurrentDynasty(),
                currentDynasty
            );

            // Update the active kernel hash.
            kernelGateway.activateKernel(openKernelHash);
        }

        // Store the kernel observations for the block hash.
        kernelHashes[_blockHash] = kernelGateway.getActiveKernelHash();

    }

}
