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
import "../../contracts/core/Stake.sol";
import "../../contracts/gateway/MockToken.sol";

/**
 * @title Testing the functions of the Stake contract that will be invoked by
 *        other contracts.
 */
contract TestStake {

    /* Private Variables */

    MockToken private mockToken;
    Stake private stake;

    /* External Functions */

    /** @notice Deploying the dependant contracts for every test. */
    function beforeEach() external {

        mockToken = new MockToken();
        stake = new Stake(
            address(mockToken),
            address(this)
        );
    }

    function testValidatorAtHeightPlusTwo() external {
        deposit(address(54), (25 * 10 ** 18));
        assertNoValidatorUpdates(0);

        address[] memory updatedValidators;
        uint256[] memory updatedWeights;
        (updatedValidators, updatedWeights) = stake.closeMetaBlock(1);
        assertValidatorUpdatesLength(1, updatedValidators, updatedWeights);
        Assert.equal(
            updatedValidators[0],
            address(54),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[0],
            (25 * 10 ** 18),
            "The correct weight should be returned for the validator at the new height."
        );
    }

    function testMultipleValidatorsAtDifferentHeights() external {
        deposit(address(54), 80);
        assertNoValidatorUpdates(0);

        deposit(address(55), 100);

        address[] memory updatedValidators;
        uint256[] memory updatedWeights;
        (updatedValidators, updatedWeights) = stake.closeMetaBlock(1);
        assertValidatorUpdatesLength(1, updatedValidators, updatedWeights);
        Assert.equal(
            updatedValidators[0],
            address(54),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[0],
            80,
            "The correct weight should be returned for the validator at the new height."
        );

        (updatedValidators, updatedWeights) = stake.closeMetaBlock(2);
        assertValidatorUpdatesLength(1, updatedValidators, updatedWeights);
        Assert.equal(
            updatedValidators[0],
            address(55),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[0],
            100,
            "The correct weight should be returned for the validator at the new height."
        );
    }

    function testMultipleValidatorsAtTheSameHeight() external {
        deposit(address(54), 80);
        assertNoValidatorUpdates(0);

        deposit(address(55), 100);
        deposit(address(56), 300);

        address[] memory updatedValidators;
        uint256[] memory updatedWeights;
        (updatedValidators, updatedWeights) = stake.closeMetaBlock(1);
        assertValidatorUpdatesLength(1, updatedValidators, updatedWeights);
        Assert.equal(
            updatedValidators[0],
            address(54),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[0],
            80,
            "The correct weight should be returned for the validator at the new height."
        );

        (updatedValidators, updatedWeights) = stake.closeMetaBlock(2);
        assertValidatorUpdatesLength(2, updatedValidators, updatedWeights);
        Assert.equal(
            updatedValidators[0],
            address(55),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[0],
            100,
            "The correct weight should be returned for the validator at the new height."
        );
        Assert.equal(
            updatedValidators[1],
            address(56),
            "The deposited validator should be returned for the new height."
        );
        Assert.equal(
            updatedWeights[1],
            300,
            "The correct weight should be returned for the validator at the new height."
        );
    }

    /**
     * @notice Deposits the given amount for the given validator.
     *
     * @param _validator The validator to deposit for.
     * @param _amount The amount to deposit.
     */
    function deposit(address _validator, uint256 _amount) private {
        mockToken.approve(address(stake), _amount);
        stake.deposit(
            _validator,
            _amount
        );
    }

    /**
     * @notice Closes an meta-block and asserts that it does non return any 
     *         updates.
     */
    function assertNoValidatorUpdates(uint256 _closingHeight) private {
        address[] memory updatedValidators;
        uint256[] memory updatedWeights;
        (updatedValidators, updatedWeights) = stake.closeMetaBlock(
            _closingHeight
        );
        
        Assert.equal(
            updatedValidators.length,
            0,
            "There should not be a validator update closing at this height."
        );
        Assert.equal(
            updatedWeights.length,
            0,
            "There should not be a validator update closing at this height."
        );
    }

    /**
     * @notice Asserts that both given arrays have the given length.
     *
     * @param _length The length to check for.
     * @param _addresses The array of addresses to check.
     * @param _weights The array of weights to check.
     */
    function assertValidatorUpdatesLength(
        uint256 _length,
        address[] memory _addresses,
        uint256[] memory _weights
    )
        private
    {
        Assert.equal(
            _addresses.length,
            _length,
            "There should be the correct number of validator updates."
        );
        Assert.equal(
            _weights.length,
            _length,
            "There should be the correct number of weight updates."
        );
    }
}
