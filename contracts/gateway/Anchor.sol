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
import "../lib/IsMemberInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/Organized.sol";
import "../lib/RLP.sol";
import "../lib/SafeMath.sol";

/**
 * @title Anchor contract which implements StateRootInterface.
 *
 * @notice Anchor stores another chain's state roots. It stores the address of
 *         the co-anchor, which will be the anchor on the other chain. State
 *         roots are exchanged bidirectionally between the anchor and the
 *         co-anchor by the workers that are registered as part of the
 *         `Organized` interface.
 */
contract Anchor is StateRootInterface, Organized {

    /** Usings */

    using SafeMath for uint256;


    /** Events */

    event StateRootAvailable(uint256 _blockHeight, bytes32 _stateRoot);


    /** Storage */

    /** Maps block heights to their respective state root. */
    mapping (uint256 => bytes32) private stateRoots;

    /**
     * The remote chain ID is the remote chain id where anchor contract is
     * deployed.
     */
    uint256 private remoteChainId;

    /** Latest block height of block for which state root was anchored. */
    uint256 private latestStateRootBlockHeight;

    /** Address of the anchor on the auxiliary chain. Can be zero. */
    address public coAnchor;


    /*  Constructor */

    /**
     *  @notice Contract constructor.
     *
     *  @param _remoteChainId _remoteChainId is the chain id of the chain that
     *                        this anchor tracks.
     *  @param _blockHeight Block height at which _stateRoot needs to store.
     *  @param _stateRoot State root hash of given _blockHeight.
     *  @param _membersManager Address of a members manager contract.
     */
    constructor(
        uint256 _remoteChainId,
        uint256 _blockHeight,
        bytes32 _stateRoot,
        IsMemberInterface _membersManager
    )
        Organized(_membersManager)
        public
    {
        require(
            _remoteChainId != 0,
            "Remote chain Id must not be 0."
        );

        remoteChainId = _remoteChainId;

        latestStateRootBlockHeight = _blockHeight;
        stateRoots[latestStateRootBlockHeight] = _stateRoot;
    }


    /* External functions */

    /**
     *  @notice The Co-Anchor address is the address of the anchor that is
     *          deployed on the other (origin/auxiliary) chain.
     *
     *  @param _coAnchor Address of the Co-Anchor on auxiliary.
     */
    function setCoAnchorAddress(address _coAnchor)
        external
        onlyOrganization
        returns (bool success_)
    {

        require(
            _coAnchor != address(0),
            "Co-Anchor address must not be 0."
        );

        require(
            coAnchor == address(0),
            "Co-Anchor has already been set and cannot be updated."
        );

        coAnchor = _coAnchor;

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
     * @notice Gets the block height of latest anchored state root.
     *
     * @return uint256 Block height of the latest anchored state root.
     */
    function getLatestStateRootBlockHeight()
        external
        view
        returns (uint256 height_)
    {
        height_ = latestStateRootBlockHeight;
    }

    /**
     *  @notice Anchor new state root for a block height.
     *
     *  @param _blockHeight Block height for which stateRoots mapping needs to
     *                      update.
     *  @param _stateRoot State root of input block height.
     *
     *  @return bytes32 stateRoot
     */
    function anchorStateRoot(
        uint256 _blockHeight,
        bytes32 _stateRoot
    )
        external
        onlyWorker
        returns (bool success_)
    {
        // State root should be valid
        require(
            _stateRoot != bytes32(0),
            "State root must not be zero."
        );

        // Input block height should be valid
        require(
            _blockHeight > latestStateRootBlockHeight,
            "Given block height is lower or equal to highest anchored state root block height."
        );

        stateRoots[_blockHeight] = _stateRoot;
        latestStateRootBlockHeight = _blockHeight;

        emit StateRootAvailable(_blockHeight, _stateRoot);

        success_ = true;
    }

    /**
     *  @notice Get the remote chain id of this anchor.
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
