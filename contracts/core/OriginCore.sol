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

import "../OstInterface.sol";
import "./OriginCoreConfig.sol";
import "./OriginCoreInterface.sol";

/**
 * @title OriginCore is a meta-blockchain with staked validators on Ethereum.
 */
contract OriginCore is OriginCoreInterface, OriginCoreConfig {

    /* Events */

    /** Emitted whenever a block is successfully reported. */
    event BlockReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /* Structs */

    /** The header of an OSTblock. */
    struct Header {

        /** The height of this header's block in the chain. */
        uint256 height;

        /** The hash of this block's parent. */
        bytes32 parent;

        /**
         * The total gas that has been consumed on auxiliary for all blocks
         * that are inside this OSTblock.
         */
        uint256 gas;

        /**
         * The root hash of the trie of signatures of votes on the highest
         * finalised auxiliary checkpoint that is contained within this
         * OSTblock.
         */
        bytes32 signatureRoot;

        /**
         * The root hash of the state trie of the latest finalised checkpoint
         * on auxiliary that is part of this OSTblock.
         */
        bytes32 stateRoot;
    }

    /* Public Variables */

    OstInterface public Ost;

    uint256 public chainIdAuxiliary;

    /** Height of the open block. */
    uint256 public height;

    /** head is the block header hash of the latest committed block. */
    bytes32 public head;

    /**
     * Mapping of block hashes to block headers that were reported with the
     * respective hash.
     */
    mapping (bytes32 => Header) public reportedHeaders;

    /* Constructor */

    /**
     * @param _chainIdAuxiliary The id of the auxiliary chain that this core
     *                          contract tracks.
     * @param _ost The address of the OST ERC-20 token.
     */
    constructor(
        uint256 _chainIdAuxiliary,
        address _ost
    )
        public
    {
        require(_ost != address(0), "Address for OST should not be zero.");

        chainIdAuxiliary = _chainIdAuxiliary;
        Ost = OstInterface(_ost);
    }

    /* External Functions */

    /**
     * @notice Report an OSTblock. A reported OSTblock can be committed by
     *         receiving a majority vote from the validators.
     *
     * @dev The core contract must be approved for the `COST_REPORT_BLOCK`.
     *
     * @param _blockHash The hash of the header of the block.
     * @param _height The OSTblock height of the reported block.
     * @param _gas The amount of gas consumed on the auxiliary system within
     *             this block.
     * @param _signatureRoot The root hash of the trie of validator signatures
     *                       of votes on the highest finalised auxiliary
     *                       checkpoint that is contained within this OSTblock.
     * @param _stateRoot The root hash of the state trie of the highest
     *                   finalised auxiliary checkpoint that is contained
     *                   within this OSTblock.
     *
     * @return success_ Indicates whether the block report was processed
     *                  successfully.
     */
    function reportBlock (
        bytes32 _blockHash,
        uint256 _height,
        uint256 _gas,
        bytes32 _signatureRoot,
        bytes32 _stateRoot
    )
        external
        returns (bool success_)
    {
        require(
            height == _height,
            "Cannot report a block at a height different from the open block height."
        );

        Header memory header = Header(
            height,
            head,
            _gas,
            _signatureRoot,
            _stateRoot
        );
        require(
            _blockHash == hashHeader(header),
            "The reported block hash must match the reported data."
        );
        require(
            !blockHasBeenReported(_blockHash),
            "The given header has already been reported at the given height."
        );

        require(
            Ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK),
            "It must be possible to transfer the cost of the report."
        );

        reportedHeaders[_blockHash] = header;
        emit BlockReported(height, _blockHash);

        success_ = true;
    }

    /**
     * @notice Proposes a new OSTblock. The block is stored if the proposal
     *         succeeds, but its votes still need to be verified in order for
     *         it to be committed.
     *
     * @param _ostBlockHeaderRlp The entire header of the proposed OSTblock,
     *                           RLP encoded.
     * @param _dynasty The dynasty number where the OSTblock closes on the
     *                 auxiliary chain. It is not part of the OSTblock header
     *                 and must therefore be presented separately.
     */
    function proposeBlock(
        bytes _ostBlockHeaderRlp,
        uint256 _dynasty
    )
        external
        returns (bool success_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice Verifies two of the votes that justified this block and two of
     *         the votes that justified its child checkpoint, therefore
     *         finalising the previous checkpoint.
     *
     * @param _ostBlockHash The block hash of the OSTblock for which a vote
     *                      shall be verified.
     * @param _voteTrieBranchRlp The trie branch of the trie of votes on the
     *                           auxiliary checkpoint that is the last
     *                           finalised checkpoint in the OSTblock.
     * @param _childVoteTrieBranchRlp The trie branch of the trie of votes from
     *                                the last finalised checkpoint to its
     *                                direct checkpoint. Thus finalising the
     *                                source of the votes with a supermajority.
     *
     * @return `true` if the verification succeeded.
     */
    function verifyVote(
        bytes32 _ostBlockHash,
        bytes _voteTrieBranchRlp,
        bytes _childVoteTrieBranchRlp
    )
        external
        returns (bool success_)
    {
        revert("Method not implemented.");
    }

    /**
     * @notice The id of the remote chain that is tracked by this core.
     *
     * @return The id of the remote chain.
     */
    function chainIdAuxiliary()
        external
        view
        returns (uint256)
    {
        return chainIdAuxiliary;
    }

    /**
     * @notice Returns the block height of the latest OSTblock that has been
     *         committed.
     *
     * @dev An OSTblock has been committed if it has been proposed and the
     *      votes have been verified.
     *
     * @return The height of the latest committed OSTblock.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256)
    {
        /*
         * `height` is the current open OSTblock. The latest committed block is
         * therefore at `height - 1`.
         */
        return height - 1;
    }

    /**
     * @notice Get the state root of an OSTblock.
     *
     * @param _blockHeight For which blockheight to get the state root.
     *
     * @return The state root of the OSTblock.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_)
    {
        revert("Method not implemented.");
    }

    /* Internal Functions */

    /**
     * @notice Creates the hash of the concatenated data of a block header.
     *
     * @dev The resulting hash can be used to uniquely identify this block.
     *
     * @param _header The block header to hash.
     *
     * @return The hash for this block header.
     */
    function hashHeader (
        Header _header
    )
        internal
        pure
        returns (bytes32)
    {
        /*
         * The list of excluded validators is expensive to hash and constant
         * for all reported blocks at a given height so we omit it from the
         * block hash definition.
         */
        return keccak256(
            abi.encodePacked(
                _header.height,
                _header.parent,
                _header.gas,
                _header.signatureRoot,
                _header.stateRoot
            )
        );
    }

    /* Private Functions */

    /**
     * @notice Returns true if the given hash has already been reported.
     *
     * @param _headerHash The hash of the header that should be checked.
     *
     * @return `true` if the header already exists.
     */
    function blockHasBeenReported(
        bytes32 _headerHash
    )
        private
        view
        returns (bool)
    {
        return reportedHeaders[_headerHash].stateRoot != bytes32(0);
    }
}
