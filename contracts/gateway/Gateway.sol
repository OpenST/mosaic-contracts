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
// Origin Chain: Gateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/*
Origin chain      |       Auxiliary chain
-------------------------------------------------------------------------------
EIP20Gateway - - - - - - - - - - - EIP20CoGateway
-------------------------------------------------------------------------------
1. GatewayLinking:

initiateGatewayLink  --->   confirmGatewayLinkIntent
|
progressGatewayLink  --->   progressGatewayLink
-------------------------------------------------------------------------------
*/

import "./MessageBus.sol";
import "./EIP20Interface.sol";
import "./GatewayBase.sol";

/**
 *  @title Gateway contract.
 *
 *  @notice Gateway contains functions for initial setup of EIP20-gateway.
 */
contract Gateway is  GatewayBase {

    /** address of ERC20 token. */
    EIP20Interface public token;

    /**
     * address of ERC20 token in which
     * the facilitator will stake(bounty) for a process
     */
    EIP20Interface public baseToken;

    /**
     * @notice Initialise the contract by providing the ERC20 token address
     *         for which the gateway will enable facilitation of staking and
     *         minting.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _baseToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organisation Organisation address.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation
    )
        GatewayBase(
            _core,
            _bounty,
            _organisation
        )
        public
    {

        require(
            address(_token) != address(0),
            "Token contract address must not be zero"
        );
        require(
            address(_baseToken) != address(0),
            "Base token contract address for bounty must not be zero"
        );
        token = _token;
        baseToken = _baseToken;
    }
}
