/* solhint-disable-next-line compiler-fixed */
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
// Utility chain: UtilityToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./UtilityTokenInterface.sol";
import "./EIP20Token.sol";
import "./CoGatewayUtilityTokenInterface.sol";

/**
 *  @title UtilityTokenAbstract contract which implements
 *         UtilityTokenInterface.
 *         TODO: Add organisation.
 *
 *  @notice Contains methods for utility tokens.
 */
contract UtilityToken is
    EIP20Token,
    UtilityTokenInterface,
    CoGatewayUtilityTokenInterface
{
    using SafeMath for uint256;

    /** Storage */

    address public valueToken;

    address coGateway;

    /** checks that only organisation can call a particular function. */
    modifier onlyCoGateway() {
        require(
            msg.sender == coGateway,
            "Only CoGateway can call the function"
        );
        _;
    }

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @dev TODO: Sets Organisation with msg.sender address.
     *
     */
    constructor(
        string _symbol,
        string _name,
        uint8 _decimals,
        address _valueToken
    )
        public
        EIP20Token(_symbol, _name, _decimals)
        //TODO: add organisation
    {
        require(
            _valueToken != address(0),
            "ERC20 token should not be zero"
        );

        valueToken = _valueToken;
    }

    // This will be set with zero gas
    function setCoGateway(address _coGatewayAddress)
        external
        //TODO: add organisation
        returns (bool)
    {
        require(
            coGateway == address(0),
            "CoGateway address already set"
        );

        require(
            CoGatewayUtilityTokenInterface(_coGatewayAddress).utilityToken() ==
            address(this),
            "CoGateway is linked with some other utility token"
        );

        coGateway = _coGatewayAddress;

        emit CoGatewaySet(address(this), coGateway);
    }


    /**
    *  @notice Internal function mintEIP20.
    *
    *  @dev Adds _amount tokens to EIP20Token contract balance.
    *
    *  @param _beneficiary Address of tokens beneficiary.
    *  @param _amount Amount of tokens to mint.
    *
    *  @return bool True if mint is successful, false otherwise.
    */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool /* success */)
    {
        // mint EIP20 tokens in contract address for them to be claimed
        balances[_beneficiary] = balances[_beneficiary].add(_amount);
        totalTokenSupply = totalTokenSupply.add(_amount);

        emit Minted(_beneficiary, _amount, totalTokenSupply, address(this));
        return true;
    }

    /**
     *  @notice Internal function burnEIP20.
     *
     *  @dev only burns the amount from CoGateway address, So to burn
     *       transfer the amount to CoGateway.
     *
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if burn is successful, false otherwise.
     */
    function burn(
        address _burner,
        uint256 _amount
    )
        external
        onlyCoGateway
        returns (bool /* success */)
    {
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        totalTokenSupply = totalTokenSupply.sub(_amount);

        emit Burnt(_burner, _amount, totalTokenSupply, address(this));
        return true;
    }

}