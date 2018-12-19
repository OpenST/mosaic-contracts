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


import "./WorkersInterface.sol";
import "../StateRootInterface.sol";
import "../lib/CircularBufferUint.sol";
import "../lib/IsMemberInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/Organized.sol";
import "../lib/RLP.sol";
import "../lib/SafeMath.sol";

/**
 * @title SafeCore contract which implements StateRootInterface.
 *
 * @notice SafeCore stores another chain's state roots. It stores the address of
 *         the co-core, which will be the safe core on the other chain. State
 *         roots are exchanged bidirectionally between the core and the co-core
 *         by the workers that are registered as part of the `Organized`
 *         interface.
 */
contract SafeCore is StateRootInterface, Organized, CircularBufferUint {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event StateRootAvailable(uint256 _blockHeight, bytes32 _stateRoot);


    /* Storage */

    /** Maps block heights to their respective state root. */
    mapping (uint256 => bytes32) private stateRoots;

    /**
     * The remote chain ID is the remote chain id where core contract is
     * deployed.
     */
    uint256 private remoteChainId;

    /** Address of the core on the auxiliary chain. Can be zero. */
    address public coCore;


    /*  Constructor */

    /**
     * @notice Contract constructor.
     *
     * @param _remoteChainId The chain id of the chain that is tracked by this
     *                       core.
     * @param _blockHeight Block height at which _stateRoot needs to store.
     * @param _stateRoot State root hash of given _blockHeight.
     * @param _maxStateRoots The max number of state roots to store in the
     *                       circular buffer.
     * @param _membersManager Address of a members manager contract.
     */
    constructor(
        uint256 _remoteChainId,
        uint256 _blockHeight,
        bytes32 _stateRoot,
        uint256 _maxStateRoots,
        IsMemberInterface _membersManager
    )
        Organized(_membersManager)
        CircularBufferUint(_maxStateRoots)
        public
    {
        require(
            _remoteChainId != 0,
            "Remote chain Id must not be 0."
        );

        remoteChainId = _remoteChainId;

        stateRoots[_blockHeight] = _stateRoot;
        CircularBufferUint.store(_blockHeight);
    }


    /* External functions */

    /**
     *  @notice The Co-Core address is the address of the core that is
     *          deployed on the other (origin/auxiliary) chain.
     *
     *  @param _coCore Address of the Co-Core on auxiliary.
     */
    function setCoCoreAddress(address _coCore)
        external
        onlyOrganization
        returns (bool success_)
    {
        require(
            coCore == address(0),
            "Co-Core has already been set and cannot be updated."
        );

        require(
            _coCore != address(0),
            "Co-Core address must not be 0."
        );

        coCore = _coCore;

        success_ = true;
    }

    /**
     * @notice Get the state root for the given block height.
     *
     * @param _blockHeight The block height for which the state root is needed.
     *
     * @return bytes32 State root of the given height.
     */
    function getStateRoot(
        uint256 _blockHeight
    )
        external
        view
        returns (bytes32 stateRoot_)
    {
        stateRoot_ = stateRoots[_blockHeight];
    }

    /**
     * @notice Gets the block height of latest committed state root.
     *
     * @return uint256 Block height of the latest committed state root.
     */
    function getLatestStateRootBlockHeight()
        external
        view
        returns (uint256 height_)
    {
        height_ = CircularBufferUint.head();
    }

    /**
     *  @notice External function commitStateRoot.
     *
     *  @dev commitStateRoot Called from game process.
     *       Commit new state root for a block height.
     *
     *  @param _blockHeight Block height for which stateRoots mapping needs to
     *                      update.
     *  @param _stateRoot State root of input block height.
     *
     *  @return bytes32 stateRoot
     */
    function commitStateRoot(
        uint256 _blockHeight,
        bytes32 _stateRoot
    )
        external
        onlyOrganization
        returns (bool success_)
    {
        // State root should be valid
        require(
            _stateRoot != bytes32(0),
            "State root must not be zero."
        );

        // Input block height should be valid
        require(
            _blockHeight > CircularBufferUint.head(),
            "Given block height is lower or equal to highest committed state root block height."
        );

        stateRoots[_blockHeight] = _stateRoot;
        uint256 oldestStoredBlockHeight = CircularBufferUint.store(_blockHeight);
        delete stateRoots[oldestStoredBlockHeight];

        emit StateRootAvailable(_blockHeight, _stateRoot);

        success_ = true;
    }

    /**
     *  @notice Get the remote chain id of this core.
     *
     *  @return remoteChainId_ The remote chain id.
     */
    function getRemoteChainId()
        external
        view
        returns (uint256 remoteChainId_)
    {
        remoteChainId_ = remoteChainId;
    }
}
