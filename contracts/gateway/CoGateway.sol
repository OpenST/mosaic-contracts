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
// Auxiliary Chain: CoGateway Contract
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
import "../lib/SafeMath.sol";
import "./GatewayBase.sol";
import "./CoreInterface.sol";
import "./UtilityTokenInterface.sol";
import "../lib/GatewayLib.sol";

/**
 *  @title CoGateway contract.
 *
 *  @notice CoGateway contains functions for initial setup of EIP20CoGateway.
 */
contract CoGateway is GatewayBase {

    using SafeMath for uint256;

    /* public variables */

    /** address of utility token. */
    address public utilityToken;

    /** address of value token. */
    address public valueToken;

    /* Constructor */

    /**
     * @notice Initialise the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         minting and redeeming.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organisation Organisation address.
     * @param _gateway Gateway contract address.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation,
        address _gateway
    )
        GatewayBase(
            _core,
            _bounty,
            _organisation
        )
        public
    {
        require(
            _valueToken != address(0),
            "Value token address must not be zero"
        );
        require(
            _utilityToken != address(0),
            "Utility token address must not be zero"
        );
        require(
            _gateway != address(0),
            "Gateway address must not be zero"
        );

        valueToken = _valueToken;
        utilityToken = _utilityToken;
        core = _core;
        remoteGateway = _gateway;

        // update the encodedGatewayPath
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(remoteGateway))
        );
    }

    /* External functions */
}
