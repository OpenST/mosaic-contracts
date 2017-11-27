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
// Utility chain: STPrimeMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./STPrime.sol";

/// @title STPrimeMock
/// @dev Overrides STPrime.initialize to not require initialization faucet to be empty, which problematizes testing
///      To make use of this in testing, `initialized` must be changed to `public` in STPrime
contract STPrimeMock is STPrime {
    function STPrimeMock(
    	address _openSTProtocol,
    	bytes32 _uuid)
    	STPrime(_openSTProtocol, _uuid)
    	public
	{

	}

    function initialize()
        public
        payable
    {
        // @dev before the registrar registers a core on the value chain
        //      it must verify that the genesis exactly specified TOKENS_MAX
        //      so that all base tokens are held by STPrime 
        require(msg.value == TOKENS_MAX);
        initialized = true;
    }
}