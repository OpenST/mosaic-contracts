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

import "./CoreConfig.sol";
import "./CoreInterface.sol";

/**
 * @title Core is a Proof-of-Stake blockchain on Ethereum
 */
contract Core is CoreInterface, CoreConfig {

	/* Structs */

    struct Header {
        uint128 height;
        bytes32 parent;
        uint256 gas;
        bytes32 signatureRoot;
        bytes32 transactionRoot;
        bytes32 stateRoot;
        address[] excludedValidators;
	}

    struct Seal {
        address reporter;
        uint256 reward;
        uint256 votesCast;
        bool sealed;
    }

    struct Block {
        Header header;
        Seal seal;
    }

    struct Validator {
        uint256 stake;
        bytes32 votedHeader;
        uint128 inclusionHeight;
        uint128 withdrawalHeight;
        bool hasEnded;
    }

    mapping (bytes32 => Block) blocks;
    mapping (uint256 => bytes32) chain;
    mapping (address => Validator) validators;
    /* height of the open block*/
    uint128 height;
    /* head is the block hash of the last sealed block */
    bytes32 head;
    /* treat gas price as constant for now */
    uint256 gasPrice;

	constructor() public {

	}

    function reportBlock(
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
        // require(ost.transferFrom(msg.sender, address(this), COST_REPORT_BLOCK));
        return true;
    }
}