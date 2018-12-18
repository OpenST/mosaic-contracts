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

import "../../lib/OrganizationInterface.sol";

/**
 * @title Mocks an organization interface implementation.
 *
 * @notice The only valid registered worker is given at construction and cannot
 *         be removed.
 */
contract MockOrganization is OrganizationInterface {

    /* Storage */

    /** The address of the registered owner. */
    address owner;

    /** The address of the registered worker. */
    address worker;

    /* Constructor */

    /**
     * @notice Sets the address of the worker.
     *
     * @param _owner Address that should be used as a registered owner.
     * @param _worker Address that should be used as a registered worker.
     */
    constructor(address _owner, address _worker) public {
        owner = _owner;
        worker = _worker;
    }

    /* External functions */

    /**
     * @notice Checks if an address is the owner of the organization.
     *
     * @param _owner Address to check.
     *
     * @return isOwner_ True if the given address is the current owner of the
     *                  organization. Returns false otherwise.
     */
    function isOwner(
        address _owner
    )
        external
        view
        returns (bool isOwner_)
    {
        isOwner_ = owner == _owner;
    }

    /**
     * @notice Checks if an address is currently registered as an active worker.
     *
     * @param _worker Address to check.
     *
     * @return isWorker_ True if the given address is a registered worker.
     */
    function isWorker(address _worker) external view returns (bool isWorker_) {
        isWorker_ = worker == _worker;
    }

    /**
     * @notice Proposes a new owner of this contract. Ownership will not be
     *         transferred until the new, proposed owner accepts the proposal.
     *         Allows resetting of proposed owner to address(0).
     *
     * @param _proposedOwner Proposed owner address.
     *
     * @return success_ True on successful execution.
     */
    function initiateOwnershipTransfer(
        address _proposedOwner
    )
        external
        returns (bool success_)
    {
        _proposedOwner;
        success_ = true;
    }

    /**
     * @notice Complete ownership transfer to proposed owner.
     *
     * @return success_ True on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool success_) {
        success_ = true;
    }

    /**
     * @notice Sets admin address.
     *
     * @param _admin Admin address to be set.
     *
     * @return success_ True on successful execution.
     */
    function setAdmin(address _admin) external returns (bool success_) {
        _admin;
        success_ = true;
    }

    /**
     * @notice Sets worker and its expiration block height.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration block height of the given worker.
     *
     * @return remainingBlocks_ Remaining number of blocks for which worker is
     *                          active.
     */
    function setWorker(
        address _worker,
        uint256 _expirationHeight
    )
        external
        returns (uint256 remainingBlocks_)
    {
        _worker;
        remainingBlocks_ = _expirationHeight - block.number;
    }

    /**
     * @notice Removes a worker.
     *
     * @param _worker Worker address to be removed.
     *
     * @return isUnset_ True if the worker existed else returns false.
     */
    function unsetWorker(address _worker) external returns (bool isUnset_) {
        _worker;
        isUnset_ = true;
    }
}
