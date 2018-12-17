/* solhint-disable-next-line compiler-fixed */
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

// TestOSTPrime is used to test the OSTPrime contract.
import "../../gateway/OSTPrime.sol";

/** @title Test OST prime contract. */
contract TestOSTPrime is OSTPrime {


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @dev This contract is used only for testing.
     *
     * @param _valueToken ERC20 token address in origin chain.
     * @param _organization Address of a contract that manages organization.
     */
    constructor(
        EIP20Interface _valueToken,
        OrganizationInterface _organization
    )
        public
        OSTPrime(_valueToken, _organization)
    {}


    /* Public functions. */

    /**
     * @notice Set the OST Prime token balance for the given account address.
     *
     * @dev This is used only for testing.
     *
     * @param _account Address for which the balance is to be set.
     * @param _amount The amount of tokens to be set.
     */
    function setTokenBalance(
        address _account,
        uint256 _amount
    )
        public
    {
        balances[_account] = _amount;
    }

    /**
     * @notice Set the CoGateway address for testing.
     *
     * @param _coGatewayAddress CoGateway address.
     */
    function setCoGatewayAddress(address _coGatewayAddress) public {
        coGateway = _coGatewayAddress;
    }

    /**
     * @notice Set the total supply count for testing.
     *
     * @param _amount The supply amount.
     */
    function setTotalSupply(uint256 _amount) public {
        totalTokenSupply = _amount;
    }
}
