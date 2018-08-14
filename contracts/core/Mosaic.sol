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
//
// ----------------------------------------------------------------------------
// Value chain: Mosaic
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 * @title Mosaic tracks core contracts and validator stakes.
 *
 * @notice You can register other chains in this contract and it will manage
 *         the chain ids for you.
 *         Potential validators can use this contract to deposit and withdraw
 *         stake for any given chain.
 */
contract Mosaic {

    /* Events */

    /** ChainRegistered is emitted when a new chain is registered. */
    event ChainRegistered(uint256 chainId, address coreAddress);

    /* Public Variables */

    /**
     * The id of the first chain that is registered. If
     * `firstChainId == nextChainId`, then no chain has been registered yet.
     */
    uint256 public firstChainId;

    /**
     * nextChainId stores the number of the next chain that will be registered.
     * To iterate over all chains, you can do:
     * `for (uint256 chainId = firstChainId; chainId < nextChainId; chainId++)`
     */
    uint256 public nextChainId;

    /**
     * A mapping of chain ids to their respective core addresses. A core is a
     * deployed contract to interact with the chain that has the given id.
     * Existing chain ids are [firstChainId..nextChainId[
     */
    mapping(uint256 => address) public coreAddresses;

    /* Constructor */

    /**
     * @param _firstChainId The first chain that gets registered will get this
     *        id. From then on, the id will be incremented by 1 for every new
     *        chain.
     */
    constructor(uint256 _firstChainId) public {
        firstChainId = _firstChainId;
        // As this is the constructor, the next chain will be the first one.
        nextChainId = _firstChainId;
    }

    /* External Functions */

    /**
     * @notice Registers a new chain with Mosaic. Afterwards, validators and
     *         users can find the chain and the respective core address in
     *         order to interact with this.
     *
     * @param _coreAddress The address where the core of this chain is
     *        deployed.
     *
     * @return chainId_ The id of the chain that has been registered with this
     *         call.
     */
    function registerChain(
        address _coreAddress
    )
        external
        returns (uint256 chainId_)
    {
        require(
            _coreAddress != address(0),
            "The provided address should not be 0."
        );

        chainId_ = nextChainId;
        nextChainId++;

        coreAddresses[chainId_] = _coreAddress;

        emit ChainRegistered(chainId_, _coreAddress);
    }
}
