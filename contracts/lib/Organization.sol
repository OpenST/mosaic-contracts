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

import "./SafeMath.sol";
import "./OrganizationInterface.sol";


/**
 * @title Organization contract.
 *
 * @notice The organization represents an entity that manages the
 *         mosaic ecosystem and therefore the `Organization.sol` contract holds
 *         all the keys required to administer the mosaic contracts.
 *         This contract supports the notion of an "admin" that can act on
 *         behalf of the organization. When seen from the outside by consumers
 *         of the `OrganizationInterface`, a notion of an admin does not exist.
 */
contract Organization is OrganizationInterface {


    /* Using */

    using SafeMath for uint256;


    /* Events */

    /** Emitted when a current owner initiates a change of ownership. */
    event OwnershipTransferInitiated(address indexed proposedOwner);

    /** Emitted when a new owner accepts the ownership transfer. */
    event OwnershipTransferCompleted(address newOwner);

    /** Emitted whenever an owner or admin changes the address of the admin. */
    event AdminAddressChanged(address indexed newAdmin);

    /** Emitted when a worker address was set. */
    event WorkerSet(
        address indexed worker,
        uint256 expirationHeight,
        uint256 remainingHeight
    );

    /** Emitted when a worker address is deleted from the contract. */
    event WorkerUnset(address worker, bool wasSet);


    /* Storage */

    /** Address for which private key will be owned by the organization. */
    address public owner;

    /**
     * Proposed Owner is the newly proposed address that was proposed by the
     * current owner for ownership transfer.
     */
    address public proposedOwner;

    /**
     * Admin address set by owner to facilitate operations of an economy on
     * behalf of the owner.
     * While this contract includes details that regard the admin, e.g. a
     * modifier, when looking at the `OrganizationInterface`, the existence of
     * an admin is a concrete implementation detail and not known to the
     * consumers of the interface.
     */
    address public admin;

    /**
     *  Map of whitelisted worker addresses to their expiration block height.
     */
    mapping(address => uint256) public workers;


    /* Modifiers */

    /**
     * onlyOwner functions can only be called from the address that is
     * registered as the owner or admin.
     */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner is allowed to call this method."
        );

        _;
    }

    /**
     * onlyOwnerOrAdmin functions can only be called from an address that is
     * either registered as owner or as admin.
     */
    modifier onlyOwnerOrAdmin() {
        require(
            msg.sender == owner || msg.sender == admin,
            "Only owner and admin are allowed to call this method."
        );

        _;
    }


    /* Constructor */

    /**
     * @notice The address that creates the contract is set as the initial
     *         owner.
     */
    constructor() public
    {
        owner = msg.sender;
    }


    /* External functions */

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
        onlyOwner
        returns (bool success_)
    {
        require(
            _proposedOwner != owner,
            "Proposed owner address can't be current owner address."
        );

        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        success_ = true;
    }

    /**
     * @notice Complete ownership transfer to proposed owner. Must be called by
     *         the proposed owner.
     *
     * @return success_ True on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool success_)
    {
        require(
            msg.sender == proposedOwner,
            "Caller is not proposed owner address."
        );

        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(owner);

        success_ = true;
    }

    /**
     * @notice Sets the admin address. Can only be called by owner or current
     *         admin. If called by the current admin, adminship is transferred
     *         to the given address.
     *         Admin can be set to address(0).
     *
     * @param _admin Admin address to be set.
     *
     * @return success_ True on successful execution.
     */
    function setAdmin(
        address _admin
    )
        external
        onlyOwnerOrAdmin
        returns (bool success_)
    {
        require(
            _admin != owner,
            "Admin address can't be the same as the owner address."
        );

        /*
         * If the address does not change, the call is considered a success,
         * but we don't need to emit an event as it did not actually change.
         */
        if (admin != _admin) {
            admin = _admin;
            emit AdminAddressChanged(admin);
        }

        success_ = true;
    }

    /**
     * @notice Sets worker and its expiration block height.
     *         Admin/Owner has the flexibility to extend/reduce worker
     *         expiration height. This way, a worker activation/deactivation
     *         can be controlled without adding/removing worker keys.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration block height of worker.
     *
     * @return remainingBlocks_ Remaining number of blocks for which worker is
     *                          active.
     */
    function setWorker(
        address _worker,
        uint256 _expirationHeight
    )
        external
        onlyOwnerOrAdmin
        returns (uint256 remainingBlocks_)
    {
        require(
            _worker != address(0),
            "Worker address cannot be null."
        );

        require(
            _expirationHeight > block.number,
            "Expiration height must be in the future."
        );

        workers[_worker] = _expirationHeight;
        remainingBlocks_ = _expirationHeight.sub(block.number);

        emit WorkerSet(_worker, _expirationHeight, remainingBlocks_);
    }

    /**
     * @notice Removes a worker.
     *
     * @param _worker Worker address to be removed.
     *
     * @return isUnset_ True if the worker existed else returns false.
     */
    function unsetWorker(
        address _worker
    )
        external
        onlyOwnerOrAdmin
        returns (bool isUnset_)
    {
        isUnset_ = (workers[_worker] > 0);

        delete workers[_worker];

        emit WorkerUnset(_worker, isUnset_);
    }

    /**
     * @notice Checks if an address is currently registered as the organization.
     *
     * @dev It is an implementation detail of this contract that the admin can
     *      act on behalf of the organization. To the outside, an "admin"
     *      doesn't exist. See also the `admin` storage variable.
     *
     * @param _organization Address to check.
     *
     * @return isOrganization_ True if the given address represents the
     *                         organization. Returns false otherwise.
     */
    function isOrganization(
        address _organization
    )
        external
        view
        returns (bool isOrganization_)
    {
        isOrganization_ = _organization == owner || _organization == admin;
    }

    /**
     * @notice Checks if an address is currently registered as an active worker.
     *
     * @param _worker Address to check.
     *
     * @return isWorker_ True if the worker is already added and expiration
     *                   height is more than or equal to current block number.
     *                   Returns false otherwise.
     */
    function isWorker(address _worker) external view returns (bool isWorker_)
    {
        isWorker_ = workers[_worker] > block.number;
    }

}
