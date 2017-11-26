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
// Utility chain: STPrimePayable.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./STPrime.sol";

/// @title STPrimePayable
/// @dev Temporary payable implementation of STPrime--TO BE REMOVED ONCE STPRIME.SOL IS ENABLED TO RECEIVE BASE TOKENS
contract STPrimePayable is STPrime {
    /*
     * Public functions
     */
    function STPrimePayable(
    	address _openSTProtocol,
    	bytes32 _uuid)
        STPrime(_openSTProtocol, _uuid)
    	public { }

    function() public payable { }
}
