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

import "./SafeMath.sol";
import "./OrganizationInterface.sol";


/**
 * @title Organization contract handles an organization and its workers.
 *
 * @notice The organization represents an entity that manages other contracts
 *         and therefore the `Organization.sol` contract holds all the keys
 *         required to administer the other contracts.
 *         This contract supports the notion of an "admin" that can act on
 *         behalf of the organization. When seen from the outside by consumers
 *         of the `OrganizationInterface`, a notion of an admin does not exist.
 */
contract Organization is OrganizationInterface {


    /* Using */

    using SafeMath for uint256;


    /* Events */

    /** Emitted when a current owner initiates a change of ownership. */
    event OwnershipTransferInitiated(
        address indexed proposedOwner,
        address currentOwner
    );

    /** Emitted when a new owner accepts the ownership transfer. */
    event OwnershipTransferCompleted(address newOwner, address previousOwner);

    /** Emitted whenever an owner or admin changes the address of the admin. */
    event AdminAddressChanged(address indexed newAdmin, address previousAdmin);

    /** Emitted when a worker address was set. */
    event WorkerSet(address indexed worker, uint256 expirationHeight);

    /** Emitted when a worker address is deleted from the contract. */
    event WorkerUnset(address worker);


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
     * registered as the owner.
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
     * registered as owner or as admin.
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
     * @notice Creates a new organization. When you first initialize the
     *         organization, you can specify owner, admin, and workers. The
     *         owner is mandatory as it will be the only address able to make
     *         all later changes. An admin and workers can be added at
     *         construction or they can be set by the owner later.
     *
     * @param _owner The address that shall be registered as the owner of the
     *               organization.
     * @param _admin The address that shall be registered as the admin of the
     *               organization. Can be address(0) if no admin is desired.
     * @param _workers An array of initial worker addresses. Can be an empty
     *                 array if no workers are desired or known at construction.
     * @param _expirationHeight If any workers are given, this will be the
     *                          block height at which they expire.
     */
    constructor(
        address _owner,
        address _admin,
        address[] memory _workers,
        uint256 _expirationHeight
    )
        public
    {
        require(
            _owner != address(0),
            "The owner must not be the zero address."
        );

        owner = _owner;
        admin = _admin;

        for(uint256 i = 0; i < _workers.length; i++) {
            setWorkerInternal(_workers[i], _expirationHeight);
        }
    }


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

        emit OwnershipTransferInitiated(_proposedOwner, owner);

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

        emit OwnershipTransferCompleted(proposedOwner, owner);

        owner = proposedOwner;
        proposedOwner = address(0);

        success_ = true;
    }

    /**
     * @notice Sets the admin address. Can only be called by owner or current
     *         admin. If called by the current admin, adminship is transferred
     *         to the given address immediately.
     *         It is discouraged to set the admin address to be the same as the
     *         address of the owner. The point of the admin is to act on behalf
     *         of the organization without requiring the possibly very safely
     *         stored owner key(s).
     *         Admin can be set to `address(0)` if no admin is desired.
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
        /*
         * If the address does not change, the call is considered a success,
         * but we don't need to emit an event as it did not actually change.
         */
        if (admin != _admin) {
            emit AdminAddressChanged(_admin, admin);
            admin = _admin;
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
    {
        setWorkerInternal(_worker, _expirationHeight);
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
        if (workers[_worker] > 0) {
            delete workers[_worker];
            emit WorkerUnset(_worker);

            isUnset_ = true;
        }
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


    /* Private Functions */

    /**
     * @notice Sets worker and its expiration block height. If the worker
     *         already exists, then its expiration height will be overwritten
     *         with the given one.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration block height of worker.
     *
     * @return remainingBlocks_ Remaining number of blocks for which worker is
     *                          active.
     */
    function setWorkerInternal(
        address _worker,
        uint256 _expirationHeight
    )
        private
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

        emit WorkerSet(_worker, _expirationHeight);
    }

}
