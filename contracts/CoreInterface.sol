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
// Common: CoreInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract CoreInterface {
	
	function registrar() public view returns (address /* registrar */);

	function chainIdRemote() public view returns (uint256 /* chainIdRemote */);
	function openSTRemote() public view returns (address /* OpenSTRemote */);
	function getStorageRoots(uint256 _blockHeight) public view returns (bytes32);
}