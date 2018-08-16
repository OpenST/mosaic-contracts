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
 * @title OriginCore is a proof of stake blockchain on Ethereum.
 */
contract OriginCore is OriginCoreInterface, OriginCoreConfig {

    /* Events */

    /** Emitted whenever a block is successfully reported. */
    event BlockReported(
        uint256 indexed height,
        bytes32 indexed blockHash
    );

    /* Structs */

    // TODO: We want to find a way to store the transaction root.
    /** The header of an OSTblock. */
    struct Header {
        // TODO: is recomputation better than storing the header?
        /**
         * The hash of this header. Stored as part of the header so it doesn't
         * have to be recomputed when it is needed.
         */
        bytes32 hashed;

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
         * The root hash of the tree of signatures of votes on the highest
         * auxiliary checkpoint that is contained within this OSTblock.
         */
        bytes32 signatureRoot;

        /**
         * The root hash of the state tree of the latest checkpoint on
         * auxiliary that is part of this OSTblock.
         */
        bytes32 stateRoot;
    }

    /* Public Variables */

    OstInterface public Ost;

    uint256 public chainIdRemote;

    /** Height of the open block. */
    uint256 public height;

    /** head is the block header hash of the latest committed block. */
    bytes32 public head;

    /**
     * Mapping of block heights to block headers that were reported at the
     * respective height.
     */
    mapping (uint256 => Header[]) public reportedBlocks;

    /* Constructor */

    /** @param _ost The address of the OST ERC-20 token. */
    constructor(
        uint256 _chainIdRemote,
        address _ost
    )
        public
    {
        require(_ost != address(0), "Address for OST should not be zero.");

        chainIdRemote = _chainIdRemote;
        Ost = OstInterface(_ost);
    }

    /* External Functions */

    /**
     * @notice Report an OSTblock. A reported OSTblock can be committed by
     *         receiving a majority vote from the validators.
     *
     * @param _blockHash The hash of the header of the block.
     * @param _height The OSTblock height of the reported block.
     * @param _gas The amount of gas consumed on the auxiliary system within
     *             this block.
     * @param _signatureRoot The root hash of the tree of validator signatures
     *                       of votes on the highest auxiliary checkpoint that
     *                       is contained within this OSTblock.
     * @param _stateRoot The root hash of the state tree of the highest
     *                   auxiliary checkpoint that is contained within this
     *                   OSTblock.
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
    {
        require(
            height == _height,
            "Cannot report a block at a height that is not the current one."
        );

        Header memory header = Header(
            _blockHash,
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
            !blockHasBeenReported(height, _blockHash),
            "The given header has already been reported at the given height."
        );

        require(
            Ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK),
            "It must be possible to transfer the cost of the report."
        );

        reportedBlocks[height].push(header);
        emit BlockReported(height, _blockHash);
    }

    /**
     * @notice The id of the remote chain that is tracked by this core.
     *
     * @return The id of the remote chain.
     */
    function chainIdRemote()
        external
        view
        returns (uint256)
    {
        return chainIdRemote;
    }

    /**
     * @notice Returns the block height of the latest OSTblock that has been
     *         committed.
     *
     * @dev An OSTblock has been committed if it has been reported and received
     *      a majority vote from the validators.
     *
     * @return The height of the latest committed OSTblock.
     */
    function latestBlockHeight()
        external
        view
        returns (uint256)
    {
        return height - 1;
    }

    /**
     * @notice Get all reported block hashes at a given height.
     *
     * @param _height The height for which to get the reported block hashes.
     *
     * @return An array of hashes.
     */
    function getReportedBlockHashes(
        uint256 _height
    )
        external
        view
        returns (bytes32[])
    {
        Header[] storage headers = reportedBlocks[_height];
        bytes32[] memory hashes_ = new bytes32[](headers.length);

        for (uint256 i = 0; i < headers.length; i++) {
            hashes_[i] = headers[i].hashed;
        }

        return hashes_;
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
     * @notice Returns true if the given hash has already been reported at the
     *         given height.
     *
     * @param _height The height of the reported block in the chain.
     * @param _headerHash The hash of the header that should be checked.
     *
     * @return `true` if the hash already exists at the given height.
     */
    function blockHasBeenReported(
        uint256 _height,
        bytes32 _headerHash
    )
        private
        view
        returns (bool)
    {
        // TODO: is there a better way than to iterate over the array every time?
        for (uint256 i = 0; i < reportedBlocks[_height].length; i++) {
            if (_headerHash == reportedBlocks[_height][i].hashed) {
                return true;
            }
        }

        return false;
    }
}
