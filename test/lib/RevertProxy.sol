pragma solidity ^0.4.23;

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

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

/**
 * @title A proxy contract to catch and test for reverts in other contracts.
 *
 * @notice Use this contract as a proxy between the test contract and the
 *         contract under test. It will catch reverts and return false if it
 *         caught one.
 *
 * @dev An important caveat here is to recognize the contract caller,
 *      msg.sender. If you add a proxy in between, then msg.sender will be the
 *      proxy, which could break authorization and permissioning algorithms. If
 *      your authorization system allows you to change the owner, you can get
 *      around this constraint by setting the proxy to be the contract owner.
 *      It’s also important to know that this only tests throw's at this
 *      particular level.
 *      It would be prudent to also ensure there isn’t anything faulty in the
 *      proxy by creating a second test as a control. This test should be
 *      called with the appropriate gas and use the proxy to test a function
 *      where _no_ throw occurs, just to make sure the proxy is setup and
 *      working as intended.
 *      Because a throw essentially uses up all gas, one must make doubly sure
 *      they catch the throw and not a legitimate out-of-gas (OOG) error. As
 *      well, take care to manage sending Ether through the proxy (for tests
 *      that require it) as that can be difficult as well.
 *
 *      See also test/core/TestAuxiliaryStake.sol
 *
 *      Usage:
 *      contract TestThrower {
 *          function testThrow() {
 *              Thrower thrower = new Thrower();
 *              // Set Thrower as the contract to forward requests to the target.
 *              RevertProxy revertProxy = new RevertProxy(address(thrower));
 *
 *              // Prime the proxy.
 *              Thrower(address(revertProxy)).doThrow();
 *              // Execute the call that is supposed to revert.
 *              // r will be false if it reverted. r will be true if it didn't.
 *              // Make sure you send enough gas for your contract method.
 *              bool r = revertProxy.execute.gas(200000)();
 *
 *              Assert.isFalse(r, “Should be false, as it should revert");
 *          }
 *      }
 *
 *      Inspired by:
 *      https://truffleframework.com/tutorials/testing-for-throws-in-solidity-tests.
 */
contract RevertProxy {

    /* Public Variables */

    /** target is the address of the contract under test. */
    address public target;

    /** data stores the call data that will be sent to the method under test. */
    bytes public data;

    /* Constructor */

    /**
     * @param _target The address where the executed calls will be sent to.
     */
    constructor (address _target) public {
        target = _target;
    }

    /* Public Functions */

    /**
     * @notice Updates the target of the proxy so that all subsequent execute
     *         calls will be made to the new target.
     *
     * @param _newTarget The address of the contract where to send all execute
     *                   calls to.
     */
    function updateTarget(address _newTarget) public {
        target = _newTarget;
    }

    /**
     * @notice The fallback function stores the call data so that a call to the
     *         execute function will use the correct call data.
     */
    function() public {
        data = msg.data;
    }

    /**
     * @notice This will make the call to the target with the call data primed
     *         in the fallback function.
     *
     * @return `true` if the call was successful and did not revert, `false` if
     *         it reverted.
     */
    function execute() external returns (bool) {
        return target.call(data);
    }
}
