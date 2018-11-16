pragma solidity ^0.4.0;

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

import "../../core/OriginCore.sol";

/** @title The TestOriginCore is used to test few functions of OriginCore. */
contract TestOriginCore is OriginCore {

    /* Constructor */

    /**
     * @param _auxiliaryCoreIdentifier The core identifier of the auxiliary
     *                                 chain that this core contract tracks.
     * @param _ost The address of the OST ERC-20 token.
     * @param _initialAuxiliaryGas Initial gas consumed on auxiliary before
     *                             reporting genesis meta-block.
     * @param _initialTransactionRoot Transaction root of auxiliary chain
     *                                before reporting genesis meta-block.
     * @param _minimumWeight The minimum total weight that all active validators
     *                       of this meta-blockchain must have so that the
     *                       meta-blockchain is not considered halted. Used in
     *                       the constructor of the Stake contract.
     * @param _maxAccumulateGasLimit The maximum amount of gas that a
     *                               meta-block could accumulate on an
     *                               auxiliary chain before proposing a new
     *                               meta-block.
     */
    constructor(
        bytes20 _auxiliaryCoreIdentifier,
        address _ost,
        uint256 _initialAuxiliaryGas,
        bytes32 _initialTransactionRoot,
        uint256 _minimumWeight,
        uint256 _maxAccumulateGasLimit
    )
        OriginCore(
            _auxiliaryCoreIdentifier,
            _ost,
            _initialAuxiliaryGas,
            _initialTransactionRoot,
            _minimumWeight,
            _maxAccumulateGasLimit
        )
        public
    {

    }

    /**
     * @notice Set the test data for latestStateRootBlockHeight variable.
     *
     * @dev This is used for the testing only.
     *
     * @param _blockHeight Block height that needs to be set.
     */
    function setLatestStateRootBlockHeight(uint256 _blockHeight) external {
        latestStateRootBlockHeight = _blockHeight;
    }

    /**
     * @notice Set the test data for stateRoot mapping.
     *
     * @dev This is used for the testing only.
     *
     * @param _blockHeight Block height for which the stateRoot needs to be set.
     * @param _stateRoot State root that needs to be set.
     */
    function setStateRoot(
        uint256 _blockHeight,
        bytes32 _stateRoot
    )
        external
    {
        stateRoots[_blockHeight] = _stateRoot;
    }

}
