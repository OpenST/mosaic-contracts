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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./TestKernelGateway.sol";

/** @title This is used to test the failed scenarios of merkle proof. */
contract TestKernelGatewayFail is TestKernelGateway{

    /* Constructor */

    /**
     * @notice Initializes the contract with origin and auxiliary block store
     *         addresses.
     *
     * @param _mosaicCore The address of MosaicCore contract.
     * @param _originBlockStore The block store that stores the origin chain.
     * @param _auxiliaryBlockStore The block store that stores the auxiliary
     *                             chain.
     * @param _kernelHash Initial kernel hash.
     */
    constructor (
        address _mosaicCore,
        BlockStoreInterface _originBlockStore,
        BlockStoreInterface _auxiliaryBlockStore,
        bytes32 _kernelHash
    )
        TestKernelGateway(
            _mosaicCore,
            _originBlockStore,
            _auxiliaryBlockStore,
            _kernelHash
        )
        public
    {

    }


    /**
     * @notice Mocks the verify function of merkle patricia proof.
     *
     * @return success_ `false` to mock the failing scenario.
     */
    function verify(
        bytes32,
        bytes memory,
        bytes memory,
        bytes32
    )
        internal
        pure
        returns (bool success_)
    {
        success_ = false;
    }

}
