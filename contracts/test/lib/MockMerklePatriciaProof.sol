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
//
// ----------------------------------------------------------------------------
// Auxiliary Chain: MockMerklePatriciaProof
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 * @title MockMerklePatriciaProof
 *
 * @dev Library for mocking merkle patricia proofs.
 */

library MockMerklePatriciaProof {

    /**
     * @dev Mock for merkle patricia proof verifier.
     *
     * @return Mocked value for validity of the proof.
     */
    function verify(
        bytes32,
        bytes calldata,
        bytes calldata,
        bytes32
    )
        external
        pure
        returns (bool)
    {
        return true;
    }

}
