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


/**
 *  @title OrganizationInterface provides methods to manage an organization.
 */
interface OrganizationInterface {

    /* Events */

    /** Emitted when a current owner initiates a change of ownership. */
    event OwnershipTransferInitiated(address indexed proposedOwner);

    /** Emitted when a new owner accepts the ownership transfer. */
    event OwnershipTransferCompleted(address indexed newOwner);

    /** Emitted whenever an owner or admin changes the address of the admin. */
    event AdminAddressChanged(address indexed newAdmin);

    /** Emitted when a worker address was set. */
    event WorkerSet(
        address indexed worker,
        uint256 expirationHeight,
        uint256 remainingHeight
    );

    /** Emitted when a worker address is deleted from the contract. */
    event WorkerUnset(address indexed worker, bool wasSet);


    /* External Functions */

    /**
     * @notice Proposes a new owner of this contract. Ownership will not be
     *         transferred until the new, proposed owner accepts the proposal.
     *         Allows resetting of proposed owner to address(0).
     *
     * @param _proposedOwner Proposed owner address.
     *
     * @return success_ True on successful execution.
     */
    function initiateOwnershipTransfer(address _proposedOwner)
        external
        returns (bool success_);

    /**
     * @notice Complete ownership transfer to proposed owner.
     *
     * @return success_ True on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool success_);

    /**
     * @notice Sets admin address.
     *
     * @param _admin Admin address to be set.
     *
     * @return success_ True on successful execution.
     */
    function setAdmin(address _admin) external returns (bool success_);

    /**
     * @notice Sets worker and its expiration block height.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration block height of the given worker.
     *
     * @return remainingBlocks_ Remaining number of blocks for which worker is
     *                          active.
     */
    function setWorker(address _worker, uint256 _expirationHeight)
        external
        returns (uint256 remainingBlocks_);

    /**
     * @notice Removes a worker.
     *
     * @param _worker Worker address to be removed.
     *
     * @return isUnset_ True if the worker existed else returns false.
     */
    function unsetWorker(address _worker) external returns (bool isUnset_);

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
        returns (bool isOwner_);

    /**
     * @notice Checks if an address is currently registered as an active worker.
     *
     * @param _worker Address to check.
     *
     * @return isWorker_ True if the worker is already added and expiration
     *                   height is more than or equal to current block number.
     *                   Returns false otherwise.
     */
    function isWorker(address _worker) external view returns (bool isWorker_);
}
