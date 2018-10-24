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

import "truffle/Assert.sol";
import "../../contracts/lib/MetaBlock.sol";

/**
 * @title Tests the MetaBlock library.
 */
contract TestMetaBlock {

    function testHashAuxiliaryTransition() external {
        bytes32 actualHash = MetaBlock.hashAuxiliaryTransition(
            bytes20(hex"84739574832097584935602afcbdef6549875016"),
            bytes32(hex"14739574832097584935602afcbdef65498750164935602afcbdef6549875011"),
            uint256(1337),
            bytes32(hex"24739574832097584935602afcbdef65498750164935602afcbdef6549875012"),
            uint256(19851209),
            uint256(20181025),
            bytes32(hex"34739574832097584935602afcbdef65498750164935602afcbdef6549875013"),
            bytes32(hex"44739574832097584935602afcbdef65498750164935602afcbdef6549875014")
        );

        Assert.equal(
            actualHash,
            hex"c74ca259ea4286e887d3a4a5174a47e0c59152e8ccac4f7c37de6ddee4c750d5",
            ""
        );
    }

    function testHashOriginTransition() external {
        bytes32 actualHash = MetaBlock.hashOriginTransition(
            uint256(1337),
            bytes32(hex"24739574832097584935602afcbdef65498750164935602afcbdef6549875012"),
            bytes20(hex"84739574832097584935602afcbdef6549875016")
        );

        Assert.equal(
            actualHash,
            hex"39caef53c03cdbe3db387ae0a60efd5bd01985a7ca3edeedabf66a6be3ce8ff8",
            ""
        );
    }
}
