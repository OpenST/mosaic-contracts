pragma solidity ^0.5.0;

// Copyright 2017 OpenST Ltd.
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
// Common: Core
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "./WorkersInterface.sol";
import "../StateRootInterface.sol";
import "../lib/OrganizationInterface.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/Organized.sol";
import "../lib//RLP.sol";
import "../lib/SafeMath.sol";

/**
 *  @title Core contract which implements StateRootInterface.
 *
 *  @notice Core is a minimal stub that will become the anchoring and consensus point for
 *          the utility chain to validate itself against.
 */
contract Core is StateRootInterface, Organized {
    using SafeMath for uint256;

    /** Events */

    event StateRootAvailable(uint256 blockHeight, bytes32 stateRoot);

    /** Storage */

    mapping (uint256 /* block height */ => bytes32) private stateRoots;

    /** chainIdRemote is the remote chain id where core contract is deployed. */
    uint256 private coreChainIdRemote;
    /** Latest block height of block for which state root was committed. */
    uint256 private latestStateRootBlockHeight;

    /** Address of the core on the auxiliary chain. Can be zero. */
    address public coCore;

    /*  Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @param _chainIdRemote If current chain is value then _chainIdRemote is chain id of utility chain.
     *  @param _blockHeight Block height at which _stateRoot needs to store.
     *  @param _stateRoot State root hash of given _blockHeight.
     *  @param _organization Address of an organization contract.
     */
    constructor(
        uint256 _chainIdRemote,
        uint256 _blockHeight,
        bytes32 _stateRoot,
        OrganizationInterface _organization
    )
        Organized(_organization)
        public
    {
        require(_chainIdRemote != 0, "Remote chain Id is 0");

        coreChainIdRemote = _chainIdRemote;

        latestStateRootBlockHeight = _blockHeight;
        stateRoots[latestStateRootBlockHeight] = _stateRoot;
    }

    /* External functions */

    /**
     *  @notice The Co-Core address is the address of the core that is
     *          deployed on the auxiliary chain. Should only be set if this
     *          contract is deployed on the origin chain.
     *
     *  @param _coCore Address of the Co-Core on auxiliary.
     */
    function setCoCoreAddress(address _coCore)
        external
        onlyOrganization
        returns (bool /*success*/)
    {
        require(
            _coCore != address(0),
            "Co-Core address must not be 0."
        );

        coCore = _coCore;
        return true;
    }

    /**
     *  @notice Public view function chainIdRemote.
     *
     *  @return uint256 coreChainIdRemote.
     */
    function chainIdRemote()
        public
        view
        returns (uint256 /* chainIdRemote */)
    {
        return coreChainIdRemote;
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
        return stateRoots[_blockHeight];
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
        return latestStateRootBlockHeight;
    }

    /* External functions */

    /**
     *  @notice External function commitStateRoot.
     *
     *  @dev commitStateRoot Called from game process.
     *       Commit new state root for a block height.
     *
     *  @param _blockHeight Block height for which stateRoots mapping needs to update.
     *  @param _stateRoot State root of input block height.
     *
     *  @return bytes32 stateRoot
     */
    function commitStateRoot(
        uint256 _blockHeight,
        bytes32 _stateRoot
    )
        external
        onlyWorker
        returns (bytes32 /* stateRoot */)
    {
        // State root should be valid
        require(_stateRoot != bytes32(0), "State root is 0");
        // Input block height should be valid
        require(_blockHeight > latestStateRootBlockHeight, "Given block height is lower or equal to highest committed state root block height.");

        stateRoots[_blockHeight] = _stateRoot;
        latestStateRootBlockHeight = _blockHeight;

        emit StateRootAvailable(_blockHeight, _stateRoot);

        return _stateRoot;
    }
}
