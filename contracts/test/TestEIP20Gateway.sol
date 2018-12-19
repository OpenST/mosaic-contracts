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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../gateway/EIP20Gateway.sol";
import "../lib/MessageBus.sol";

/**
 * @title Test EIP20 gateway is an EIP20 gateway that is activated by default.
 */
contract TestEIP20Gateway is EIP20Gateway {

    /**
     * @notice Instantiate TestEIP20Gateway for unit testing.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _baseToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _anchor Anchor contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                stake process.
     * @param _membersManager Address of a contract that manages workers.
     * @param _burner Address where tokens will be burned.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        StateRootInterface _anchor,
        uint256 _bounty,
        IsMemberInterface _membersManager,
        address payable _burner
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _anchor,
            _bounty,
            _membersManager,
            _burner
        )
        public
    {
        activated = true;
    }
}
