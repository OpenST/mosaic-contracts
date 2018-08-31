pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
// Common: Hasher
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title Hasher contract.
 *
 *  @notice Hasher contains functions for hashing frequently occuring state variables
 *          required for the process of stake and mint / redeem and unstake.
 */
contract Hasher {

    bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
        abi.encode(
            "StakeRequest(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    bytes32 constant REDEEM_REQUEST_TYPEHASH = keccak256(
        abi.encode(
            "RedeemRequest(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );
    bytes32 constant GATEWAY_LINK_TYPEHASH =  keccak256(
        abi.encode(
            "GatewayLink(bytes32 messageHash,MessageBus.Message message)"
        )
    );


    function hashLinkGateway(
        address _gateway,
        address _coGateway,
        uint256 _bounty,
        string _tokenName,
        string _tokenSymbol,
        uint8 _tokenDecimal,
        uint256 _gasPrice,
        uint256 _nonce)
    public
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _gateway,
                _coGateway,
                _bounty,
                _tokenName,
                _tokenSymbol,
                _tokenDecimal,
                _gasPrice,
                _nonce
            )
        );
    }

    function stakeRequestTypeHash()
    external
    pure
    returns (bytes32 /* type hash */)
    {
        return STAKE_REQUEST_TYPEHASH;
    }

    function redeemRequestTypeHash()
    external
    pure
    returns (bytes32 /* type hash */)
    {
        return REDEEM_REQUEST_TYPEHASH;
    }

    function gatewayLinkTypeHash()
    external
    pure
    returns (bytes32 /* type hash */)
    {
        return GATEWAY_LINK_TYPEHASH;
    }

}