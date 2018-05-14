/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.17;

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
// Utility chain: UtilityTokenAbstractMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./UtilityTokenAbstract.sol";


/// @title UtilityTokenAbstractMock
/// @dev Implements mock claim, mint, and burn functions
/// and wraps internal functions to enable testing UtilityTokenAbstract
contract UtilityTokenAbstractMock is UtilityTokenAbstract {

    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        UtilityTokenAbstract(
        _uuid,
        _symbol,
        _name,
        _chainIdValue,
        _chainIdUtility,
        _conversionRate,
        _conversionRateDecimals)
        ProtocolVersioned(msg.sender)
        { }

    /// @dev Mock claim function
    function claim(address _beneficiary) public returns (bool success) {
        _beneficiary;
        success = true;
    }

    /// @dev Mock mint function
    function mint(address _beneficiary, uint256 _amount) public returns (bool success) {
        _beneficiary;
        _amount;
        success = true;
    }

    /// @dev Mock burn function
    function burn(address _redeemer, uint256 _amount) public payable returns (bool success) {
        _redeemer;
        _amount;
        success = true;
    }
       
    /// @dev Public wrapper for claimInternal
    function claimInternalPublic(
        address _beneficiary)
        public
        returns (uint256 amount)
    {
        amount = claimInternal(_beneficiary);
    }

    /// @dev Public wrapper for mintInternal
    function mintInternalPublic(
        address _beneficiary,
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return mintInternal(_beneficiary, _amount);        
    }

    /// @dev Public wrapper for burnInternal
    function burnInternalPublic(
        address _redeemer,
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return burnInternal(_redeemer, _amount);
    }
}