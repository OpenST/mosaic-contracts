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

import "./IsMemberInterface.sol";

/**
 * @title Organized contract.
 *
 * @notice The Organized contract facilitates integration of
 *         organization administration keys with different contracts.
 */
contract Organized {

    /* Storage */

    /**
     * IsMemberInterface of worker manager contract which holds all the
     * keys needed to administer the economy.
     */
    IsMemberInterface public membersManager;

    /* Modifiers */

    modifier onlyOrganization()
    {
        require(
            membersManager.isOwner(msg.sender),
            "Only the organization is allowed to call this method."
        );

        _;
    }

    modifier onlyWorker()
    {
        require(
            membersManager.isWorker(msg.sender),
            "Only whitelisted workers are allowed to call this method."
        );

        _;
    }

    /* Constructor */

    /**
     * @notice Sets the address of the organization contract.
     *
     * @param _membersManager A contract that manages worker keys.
     */
    constructor(IsMemberInterface _membersManager) public {
        require(
            address(_membersManager) != address(0),
            "MembersManager contract address must not be address(0)."
        );

        membersManager = _membersManager;
    }

}
