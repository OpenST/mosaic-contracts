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
import "./MosaicCoreConfig.sol";
import "./MosaicCoreInterface.sol";

/**
 * @title Core is a Proof-of-Stake blockchain on Ethereum
 */
contract MosaicCore is MosaicCoreInterface, MosaicCoreConfig {

	/* Structs */

    struct Header {
        uint128 height;
        bytes32 parent;
        uint256 gas; // todo: we should account gas in less than 256bits?
        bytes32 signatureRoot;
        bytes32 transactionRoot;
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

    OstInterface public Ost;
    mapping (bytes32 => Block) public blocks;
    mapping (uint256 => bytes32) public chain;
    mapping (address => Validator) public validators;
    /* height of the open block */
    uint128 public height;
    /* head is the block hash of the last sealed block */
    bytes32 public head;
    /* treat gas price as constant for now */
    uint256 public gasPrice;

    constructor(address _ost) public {
        require(_ost != address(0), "invalid address for OST");
        Ost = OstInterface(_ost);
    }

    function reportBlock (
        bytes32 _blockHash,
        uint128 _height,
        uint256 _gas,
        bytes32 _signatureRoot,
        bytes32 _transactionRoot,
        bytes32 _stateRoot
    )
        external
        returns (bool)
    {
        require(height == _height, "reported block at invalid height");
        require(_blockHash == hashHeader(height, head, _gas, _signatureRoot, _transactionRoot, _stateRoot), "invalid block hash");
        require(Ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK), "failed to transfer cost for reporting block");
        return true;
    }

    function hashHeader (
        uint128 _height,
        bytes32 _parent,
        uint256 _gas,
        bytes32 _signatureRoot,
        bytes32 _transactionRoot,
        bytes32 _stateRoot
    )
        internal
        pure
        returns (bytes32)
    {
        // the list of excluded validators is expensive
        // to hash and constant for all reported blocks
        // at a given height so we omit it from the block hash definition
        return keccak256(abi.encodePacked(_height, _parent, _gas, _signatureRoot, _transactionRoot, _stateRoot));
    }
}