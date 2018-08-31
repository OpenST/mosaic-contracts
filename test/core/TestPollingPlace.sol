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
import "../test_lib/RevertProxy.sol";
import "../../contracts/core/PollingPlace.sol";

/**
 * @title Wrapper to wrap polling place methods.
 *
 * @notice The wrapper is required to drop the return value from the method
 *         under test. See also:
 *         https://github.com/trufflesuite/truffle/issues/1001#issuecomment-39748268
 *
 * @dev Note that the wrapped methods do not have a return value. It is
 *      required to drop it in order for the low-level call of the RevertProxy
 *      to work.
 */
contract PollingPlaceWrapper {

    /** The wrapped contract. */
    PollingPlace pollingPlace;

    /**
     * @notice Setting the wrapped contruct. It is not necessarily known at
     *         construction.
     *
     * @param _pollingPlace The address of the wrapped contract.
     */
    function setPollingPlace(address _pollingPlace) public {
        pollingPlace = PollingPlace(_pollingPlace);
    }

    /**
     * @notice Wrapper function for the wrapped `updateOstBlockHeight`.
     *
     * @param _auxiliaryAddresses The addresses of the validators.
     * @param _stakes The stakes of the validators.
     */
    function updateOstBlockHeight(
        address[] _auxiliaryAddresses,
        uint256[] _stakes
    )
        public
    {
        pollingPlace.updateOstBlockHeight(
            _auxiliaryAddresses,
            _stakes
        );
    }
}

/**
 * @title Test contract to test the external methods of PollingPlace.
 */
contract TestPollingPlace {

    /* Private Variables */

    /*
     * Addresses and stakes are kept in storage as PollingPlace expects
     * dynamic arrays as arguments and arrays in memory are always fixed size
     * in solidity.
     */

    address private initialAddress = address(1337);
    address[] private initialAddresses;
    address[] private updateAddresses;

    uint256 private initialStake = uint256(1337);
    uint256[] private initialStakes;
    uint256[] private updateStakes;

    RevertProxy private proxy;
    PollingPlace private stake;
    PollingPlaceWrapper private wrapper;

    /* External Functions */

    /** @notice Resetting the arrays for every test to run independent. */
    function beforeEach() external {
        initialAddresses.length = 0;
        updateAddresses.length = 0;
        initialStakes.length = 0;
        updateStakes.length = 0;
    }

    function testUpdateBlock() external {
        constructContracts();

        Assert.equal(
            stake.currentOstBlockHeight(),
            uint256(0),
            "OSTblock height after initialisation should be 0."
        );
        Assert.equal(
            stake.totalStakes(uint256(0)),
            initialStake,
            "Total stake after initialisation should be 1337."
        );

        updateAddresses.push(address(2));
        updateStakes.push(uint256(19));

        /*
         * Using the same proxy logic as in the test that is expected to fail
         * below. The reason is to make sure that the provided gas to the
         * proxy's execute method would be sufficient to not trigger an out-of-
         * gas error and have a false-positive test below when expecting a
         * revert.
         */

         /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateOstBlockHeight(
            updateAddresses,
            updateStakes
        );

        /* Making the primed call from the proxy. */
        bool result = proxy.execute.gas(200000)();
        Assert.isTrue(
            result,
            "The stake contract must accept a valid new OSTblock."
        );

        Assert.equal(
            stake.currentOstBlockHeight(),
            uint256(1),
            "OSTblock height after update should be 1."
        );
        Assert.equal(
            stake.totalStakes(uint256(1)),
            uint256(1356),
            "Total stake after update should be 1356."
        );
        Assert.equal(
            stake.totalStakes(uint256(0)),
            initialStake,
            "Initial total stake after update should still be initial."
        );

        /* Validator from construction. */
        validateValidator(
            initialAddress,
            initialStake,
            false,
            uint256(0),
            uint256(0)
        );
        /* The start height after the first update should be 1. */
        validateValidator(
            address(2),
            uint256(19),
            false,
            uint256(1),
            uint256(0)
        );
    }

    function testUpdateBlockInvalidMessageSender() external {
        initialAddresses.push(initialAddress);
        initialStakes.push(initialStake);

        wrapper = new PollingPlaceWrapper();
        /*
         * Address 1 is not the wrapper, thus the wrapper is not allowed to
         * call the method and it should revert.
         */
        stake = new PollingPlace(
            address(1),
            initialAddresses,
            initialStakes
        );
        wrapper.setPollingPlace(address(stake));
        proxy = new RevertProxy(address(wrapper));

        updateAddresses.push(address(999));
        updateStakes.push(uint256(344));
        
        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if the caller is not the OSTblock gate."
        );
    }

    function testUpdateBlockInputArraysMustBeOfSameLength() external {
        constructContracts();

        updateAddresses.push(address(85));
        updateAddresses.push(address(86));
        updateStakes.push(uint256(344));

        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if the addresses array is longer."
        );

        /* The other array may also not be longer. */
        updateStakes.push(uint256(345));
        updateStakes.push(uint256(346));

        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if the stakes array is longer."
        );
    }

    function testUpdateBlockStakeMustBeGreaterZero() external {
        constructContracts();

        updateAddresses.push(address(85));
        updateStakes.push(uint256(0));

        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if the stake is zero."
        );
    }

    function testUpdateBlockValidatorAddressMustNotBeZero() external {
        constructContracts();

        updateAddresses.push(address(0));
        updateStakes.push(uint256(30000));

        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if the address is zero."
        );
    }

    function testUpdateBlockUpdateOstBlockWithRepeatedValidator() external {
        constructContracts();

        updateStakes.push(uint256(344));

        expectRevertOnUpdateOstBlockHeight(
            "The stake contract must revert if a validator address already exists."
        );
    }

    /* Private Functions */

    /**
     * @notice Helper method to construct the contracts with default values and
     *         dependencies.
     */
    function constructContracts() private {
        initialAddresses.push(initialAddress);
        initialStakes.push(initialStake);

        wrapper = new PollingPlaceWrapper();
        stake = new PollingPlace(
            address(wrapper),
            initialAddresses,
            initialStakes
        );
        wrapper.setPollingPlace(address(stake));
        proxy = new RevertProxy(address(wrapper));
    }

    /**
     * @notice Does a `updateOstBlockHeight()` call with the RevertProxy and
     *         expects the method under test to revert.
     *
     * @param _errorMessage The message to print if the contract does not
     *                      revert.
     */
    function expectRevertOnUpdateOstBlockHeight(string _errorMessage) private {
        /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateOstBlockHeight(
            updateAddresses,
            updateStakes
        );

        expectRevert(_errorMessage);
    }

    /**
     * @notice Using the RevertProxy to make the currently primed call. Expects
     *         the primed call to revert in the method under test.
     *
     * @param _errorMessage The message to print if the contract does not
     *                      revert.
     */
    function expectRevert(string _errorMessage) private {
        /* Making the primed call from the proxy. */
        bool result = proxy.execute.gas(200000)();
        Assert.isFalse(
            result,
            _errorMessage
        );
    }

    /**
     * @notice Gets a validator from the PollingPlace address based on the
     *         expected address and then compares all fields to their expected
     *         values. Fails the test if any field does not match.
     *
     * @param _expectedAddress The expected address of the validator.
     * @param _expectedStake The expected stake of the validator.
     * @param _expectedEnded The expected ended of the validator.
     * @param _expectedStartHeight The expected start height of the validator.
     * @param _expectedEndHeight The expected end height of the validator.
     */
    function validateValidator(
        address _expectedAddress,
        uint256 _expectedStake,
        bool _expectedEnded,
        uint256 _expectedStartHeight,
        uint256 _expectedEndHeight
    )
        private
    {
        address vAuxAddress;
        uint256 vStake;
        bool vEnded;
        uint256 vStartHeight;
        uint256 vEndHeight;
        (
            vAuxAddress,
            vStake,
            vEnded,
            vStartHeight,
            vEndHeight
        ) = stake.validators(_expectedAddress);
        
        Assert.equal(
            vAuxAddress,
            _expectedAddress,
            "Did not store the correct address of the validator."
        );
        Assert.equal(
            vStake,
            _expectedStake,
            "Did not store the correct stake of the validator."
        );
        Assert.equal(
            vEnded,
            _expectedEnded,
            "Did not store the correct ended of the validator."
        );
        Assert.equal(
            vStartHeight,
            _expectedStartHeight,
            "Did not store the correct start height of the validator."
        );
        Assert.equal(
            vEndHeight,
            _expectedEndHeight,
            "Did not store the correct end height of the validator."
        );
    }
}
