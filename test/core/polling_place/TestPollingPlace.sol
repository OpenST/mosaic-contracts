pragma solidity ^0.4.24;

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
import "../../../contracts/test/test_lib/RevertProxy.sol";
import "../../../contracts/test/core/BlockStoreMock.sol";
import "../../../contracts/core/PollingPlace.sol";

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
     * @notice Setting the wrapped construct. It is not necessarily known at
     *         construction.
     *
     * @param _pollingPlace The address of the wrapped contract.
     */
    function setPollingPlace(address _pollingPlace) public {
        pollingPlace = PollingPlace(_pollingPlace);
    }

    /**
     * @notice Wrapper function for the wrapped `updateMetaBlockHeight`,
     *         without a return value.
     *
     * @param _auxiliaryAddresses The addresses of the validators.
     * @param _weights The weights of the validators.
     * @param _originHeight The height of the origin chane where the new
     *                      meta-block opens.
     * @param _auxiliaryHeight The height of the auxiliary checkpoint that is
     *                         the last finalised checkpoint within the
     *                         previous, closed meta-block.
     */
    function updateMetaBlockHeight(
        address[] _auxiliaryAddresses,
        uint256[] _weights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight
    )
        public
    {
        pollingPlace.updateMetaBlockHeight(
            _auxiliaryAddresses,
            _weights,
            _originHeight,
            _auxiliaryHeight
        );
    }
}

/**
 * @title Test contract to test the external methods of PollingPlace.
 */
contract TestPollingPlace {

    /* Private Variables */

    address private initialAddress = address(1337);
    uint256 private initialWeight = uint256(1337);

    uint private gasForProxy = 200000;

    RevertProxy private proxy;
    PollingPlace private pollingPlace;
    PollingPlaceWrapper private wrapper;

    /* External Functions */

    function testUpdateBlock() external {
        constructContracts();

        Assert.equal(
            pollingPlace.currentMetaBlockHeight(),
            uint256(0),
            "meta-block height after initialization should be 0."
        );
        Assert.equal(
            pollingPlace.totalWeights(uint256(0)),
            initialWeight,
            "Total weight after initialization should be 1337."
        );

        address[] memory updateAddresses = new address[](1);
        updateAddresses[0] = address(2);
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(19);

        /*
         * Using the same proxy logic as in the test that is expected to fail
         * below. The reason is to make sure that the provided gas to the
         * proxy's execute method would be sufficient to not trigger an out-of-
         * gas error and have a false-positive test below when expecting a
         * revert.
         */

         /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1)
        );

        /* Making the primed call from the proxy. */
        bool result = proxy.execute.gas(gasForProxy)();
        Assert.isTrue(
            result,
            "The polling place must accept a valid new meta-block."
        );

        Assert.equal(
            pollingPlace.currentMetaBlockHeight(),
            uint256(1),
            "meta-block height after update should be 1."
        );
        Assert.equal(
            pollingPlace.totalWeights(uint256(1)),
            uint256(1356),
            "Total weight after update should be 1356."
        );
        Assert.equal(
            pollingPlace.totalWeights(uint256(0)),
            initialWeight,
            "Initial total weight after update should still be initial."
        );

        /* Validator from construction. */
        validateValidator(
            initialAddress,
            initialWeight,
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
        address[] memory initialAddresses = new address[](1);
        initialAddresses[0] = initialAddress;
        uint256[] memory initialWeights = new uint256[](1);
        initialWeights[0] = initialWeight;

        BlockStoreMock originBlockStore = new BlockStoreMock();
        BlockStoreMock auxiliaryBlockStore = new BlockStoreMock();
        originBlockStore.setCoreIdentifier(bytes20(1));
        auxiliaryBlockStore.setCoreIdentifier(bytes20(2));

        wrapper = new PollingPlaceWrapper();
        /*
         * Address 1 is not the wrapper, thus the wrapper is not allowed to
         * call the method and it should revert.
         */
        pollingPlace = new PollingPlace(
            address(1),
            address(originBlockStore),
            address(auxiliaryBlockStore),
            initialAddresses,
            initialWeights
        );
        wrapper.setPollingPlace(address(pollingPlace));
        proxy = new RevertProxy(address(wrapper));

        address[] memory updateAddresses = new address[](1);
        updateAddresses[0] = address(999);
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(344);
        
        expectRevertOnUpdateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if the caller is not the meta-block gate."
        );
    }

    function testUpdateBlockInputArraysMustBeOfSameLength() external {
        constructContracts();

        address[] memory updateAddresses = new address[](2);
        updateAddresses[0] = address(85);
        updateAddresses[1] = address(86);
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(344);

        expectRevertOnUpdateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if the addresses array is longer."
        );

        /* The other array may also not be longer. */
        updateWeights = new uint256[](3);
        updateWeights[0] = uint256(344);
        updateWeights[1] = uint256(345);
        updateWeights[2] = uint256(346);

        expectRevertOnUpdateMetaBlockHeight(
            new address[](0),
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if the weights array is longer."
        );
    }

    function testUpdateBlockWeightMustBeGreaterZero() external {
        constructContracts();

        address[] memory updateAddresses = new address[](1);
        updateAddresses[0] = address(85);
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(0);

        expectRevertOnUpdateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if the weight is zero."
        );
    }

    function testUpdateBlockValidatorAddressMustNotBeZero() external {
        constructContracts();

        address[] memory updateAddresses = new address[](1);
        updateAddresses[0] = address(0);
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(30000);

        expectRevertOnUpdateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if the address is zero."
        );
    }

    function testUpdateBlockUpdateMetaBlockWithRepeatedValidator() external {
        constructContracts();

        address[] memory updateAddresses = new address[](1);
        updateAddresses[0] = initialAddress;
        uint256[] memory updateWeights = new uint256[](1);
        updateWeights[0] = uint256(344);

        expectRevertOnUpdateMetaBlockHeight(
            updateAddresses,
            updateWeights,
            uint256(1),
            uint256(1),
            "The polling place must revert if a validator address already exists."
        );
    }

    function testUpdateBlockChainHeightsMustIncrease() external {
        constructContracts();

        /*
         * Using the same proxy logic as in the test that is expected to fail
         * below. The reason is to make sure that the provided gas to the
         * proxy's execute method would be sufficient to not trigger an out-of-
         * gas error and have a false-positive test below when expecting a
         * revert.
         */

         /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateMetaBlockHeight(
            new address[](0),
            new uint256[](0),
            uint256(1),
            uint256(1)
        );

        /* Making the primed call from the proxy. */
        bool result = proxy.execute.gas(gasForProxy)();
        Assert.isTrue(
            result,
            "The polling place must accept a valid new meta-block."
        );

         /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateMetaBlockHeight(
            new address[](0),
            new uint256[](0),
            uint256(4),
            uint256(9)
        );

        /* Making the primed call from the proxy. */
        result = proxy.execute.gas(gasForProxy)();
        Assert.isTrue(
            result,
            "The polling place must accept a valid new meta-block."
        );

         /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateMetaBlockHeight(
            new address[](0),
            new uint256[](0),
            uint256(5),
            uint256(14)
        );

        /* Making the primed call from the proxy. */
        result = proxy.execute.gas(gasForProxy)();
        Assert.isTrue(
            result,
            "The polling place must accept a valid new meta-block."
        );

        expectRevertOnUpdateMetaBlockHeight(
            new address[](0),
            new uint256[](0),
            uint256(3),
            uint256(200),
            "The polling place must revert if the origin height does not increase."
        );

        expectRevertOnUpdateMetaBlockHeight(
            new address[](0),
            new uint256[](0),
            uint256(200),
            uint256(7),
            "The polling place must revert if the auxiliary height does not increase."
        );
    }

    /* Private Functions */

    /**
     * @notice Helper method to construct the contracts with default values and
     *         dependencies.
     */
    function constructContracts() private {
        address[] memory initialAddresses = new address[](1);
        initialAddresses[0] = initialAddress;
        uint256[] memory initialWeights = new uint256[](1);
        initialWeights[0] = initialWeight;

        BlockStoreMock originBlockStore = new BlockStoreMock();
        BlockStoreMock auxiliaryBlockStore = new BlockStoreMock();
        originBlockStore.setCoreIdentifier(bytes20(1));
        auxiliaryBlockStore.setCoreIdentifier(bytes20(2));

        wrapper = new PollingPlaceWrapper();
        pollingPlace = new PollingPlace(
            address(wrapper),
            address(originBlockStore),
            address(auxiliaryBlockStore),
            initialAddresses,
            initialWeights
        );
        wrapper.setPollingPlace(address(pollingPlace));
        proxy = new RevertProxy(address(wrapper));
    }

    /**
     * @notice Does a `updateMetaBlockHeight()` call with the RevertProxy and
     *         expects the method under test to revert.
     *
     * @param _errorMessage The message to print if the contract does not
     *                      revert.
     */
    function expectRevertOnUpdateMetaBlockHeight(
        address[] _updateAddresses,
        uint256[] _updateWeights,
        uint256 _originHeight,
        uint256 _auxiliaryHeight,
        string _errorMessage
    )
        private
    {
        /* Priming the proxy. */
        PollingPlaceWrapper(address(proxy)).updateMetaBlockHeight(
            _updateAddresses,
            _updateWeights,
            _originHeight,
            _auxiliaryHeight
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
        bool result = proxy.execute.gas(gasForProxy)();
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
     * @param _expectedWeight The expected weight of the validator.
     * @param _expectedEnded The expected ended of the validator.
     * @param _expectedStartHeight The expected start height of the validator.
     * @param _expectedEndHeight The expected end height of the validator.
     */
    function validateValidator(
        address _expectedAddress,
        uint256 _expectedWeight,
        bool _expectedEnded,
        uint256 _expectedStartHeight,
        uint256 _expectedEndHeight
    )
        private
    {
        address vAuxAddress;
        uint256 vWeight;
        bool vEnded;
        uint256 vStartHeight;
        uint256 vEndHeight;
        (
            vAuxAddress,
            vWeight,
            vEnded,
            vStartHeight,
            vEndHeight
        ) = pollingPlace.validators(_expectedAddress);
        
        Assert.equal(
            vAuxAddress,
            _expectedAddress,
            "Did not store the correct address of the validator."
        );
        Assert.equal(
            vWeight,
            _expectedWeight,
            "Did not store the correct weight of the validator."
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
