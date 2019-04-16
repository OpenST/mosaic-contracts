pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

/**
 *  @title OrganizationInterface provides methods to check if an address is
 *         currently registered as an active participant in the organization.
 */
interface OrganizationInterface {

    /**
     * @notice Checks if an address is currently registered as the organization.
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
        returns (bool isOrganization_);

    /**
     * @notice Checks if an address is currently registered as an active worker.
     *
     * @param _worker Address to check.
     *
     * @return isWorker_ True if the given address is a registered, active
     *                   worker. Returns false otherwise.
     */
    function isWorker(address _worker) external view returns (bool isWorker_);

}
