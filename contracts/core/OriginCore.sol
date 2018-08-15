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
 * @title Core is a Proof-of-Stake blockchain on Ethereum.
 */
contract OriginCore is OriginCoreInterface, OriginCoreConfig {

    /* Structs */

    // TODO: We want to find a way to store the transaction root.
    struct Header {
        uint128 height;
        bytes32 parent;
        uint256 gas;
        bytes32 signatureRoot;
        bytes32 stateRoot;
        address[] excludedValidators;
    }

    struct Commit {
        address reporter;
        uint256 reward;
        uint256 votesCast;
        bool committed;
    }

    struct Block {
        Header header;
        Commit commit;
    }

    struct Validator {
        uint256 stake;
        bytes32 votedHeader;
        uint128 inclusionHeight;
        uint128 withdrawalHeight;
        bool hasEnded;
    }

    /* Public Variables */

    OstInterface public Ost;

    /** A mapping from block header hashes to their respective blocks. */
    mapping (bytes32 => Block) public blocks;

    /** A mapping from heights to their respective block header hashes. */
    mapping (uint256 => bytes32) public chain;

    /** A mapping from validators' addresses to their respective storage. */
    mapping (address => Validator) public validators;

    /** Height of the open block. */
    uint128 public height;

    /** head is the block hash of the last committed block. */
    bytes32 public head;

    /* Treat gas price as constant for now. */
    uint256 public gasPrice;

    /* Constructor */

    /** @param _ost The address of the OST ERC-20 token. */
    constructor(address _ost) public {
        require(_ost != address(0), "Address for OST should not be zero.");
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
        uint128 _height,
        uint256 _gas,
        bytes32 _signatureRoot,
        bytes32 _stateRoot
    )
        external
        returns (bool success_)
    {
        require(
            height == _height,
            "Cannot report a block at a height that is not the current one."
        );

        address[] memory excludedValidators;
        Header memory header = Header(
            height,
            head,
            _gas,
            _signatureRoot,
            _stateRoot,
            excludedValidators
        );
        require(
            _blockHash == hashHeader(header),
            "The reported block hash does not match the provided data."
        );
        require(Ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK), "failed to transfer cost for reporting block");
        
        // TODO: actually report block.

        success_ = true;
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
}