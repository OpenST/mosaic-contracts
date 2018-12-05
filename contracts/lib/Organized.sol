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

import "./OrganizationInterface.sol";

/**
 * @title Organized contract.
 *
 * @notice The Organized contract facilitates integration of
 *         organization administration keys with different contracts.
 */
contract Organized {

    /* Storage */

    /**
     * OrganizationInterface of worker manager contract which holds all the
     * keys needed to administer the economy.
     */
    OrganizationInterface public organization;

    /* Modifiers */

    /** Requires that `msg.sender` is an active worker. */
    modifier onlyWorker() {
        require(
            organization.isWorker(msg.sender),
            "Only whitelisted workers are allowed to call this method."
        );

        _;
    }

    /** Requires that `msg.sender` is the organization owner. */
    modifier onlyOrganization() {
        require(
            organization.isOwner(msg.sender),
            "Only the organization is allowed to call this method."
        );

        _;
    }

    /* Constructor */

    /**
     * @notice Sets the address of the organization contract.
     *
     * @param _organization A contract that manages worker keys.
     */
    constructor(OrganizationInterface _organization) public {
        require(
            address(_organization) != address(0),
            "Organization contract address must not be address(0)."
        );

        organization = _organization;
    }

}
