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

import "./CoreInterface.sol";

/**
 * @title Core is a PoS blockchain on Ethereum
 */
contract Core is CoreInterface {

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

    struct Validator {
        uint256 stake;
        uint128 start;
        uint128 end;
        bool hasEnded;
    }

    mapping (address => Validator) validators;

	constructor() public {

	}


}