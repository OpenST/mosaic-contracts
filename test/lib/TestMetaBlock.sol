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
            uint256(19850912),
            uint256(20181025),
            bytes32(hex"34739574832097584935602afcbdef65498750164935602afcbdef6549875013"),
            bytes32(hex"44739574832097584935602afcbdef65498750164935602afcbdef6549875014")
        );

        Assert.equal(
            actualHash,
            hex"e9cddf2017d6b244e8e5736ba480df5f1d4f4f042ff027057ac09b193538cffc",
            "The auxiliary transition hash did not equal the expected hash."
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
            "The origin transition hash did not equal the expected hash."
        );
    }

    function testRequiredWeightForSuperMajority() external {
        uint256 totalWeight = 3;

        uint256 requiredWeight = MetaBlock.requiredWeightForSuperMajority(
            totalWeight
        );
        uint256 expectedRequiredWeight  = 2;
        Assert.equal(
            requiredWeight,
            expectedRequiredWeight,
            "The required weight is not equal the expected required weight"
        );
    }

    function testRequiredWeightForSuperMajorityWithRoundUp() external {
        uint256 totalWeight = 4;

        uint256 requiredWeight = MetaBlock.requiredWeightForSuperMajority(
            totalWeight
        );
        uint256 expectedRequiredWeight  = 3;
        Assert.equal(
            requiredWeight,
            expectedRequiredWeight,
            "The required weight is not equal the expected required weight"
        );
    }

    function testHashMetaBlock() external {

        bytes32 actualHash = MetaBlock.hashMetaBlock(
            bytes32(hex"34739574832097584935602afcbdef65498750164935602afcbdef6549875013"),
            bytes32(hex"44739574832097584935602afcbdef65498750164935602afcbdef6549875014")
        );

        Assert.equal(
            actualHash,
            hex"1ae038ff5c070693565e63b90f84038a6113a3ebaef23fd57985ea62126d1376",
            "The meta-block hash did not equal the expected hash."
        );
    }
}
