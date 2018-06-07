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
// Common: Address Array Library Implementation
//
// http://www.simpletoken.org/
//
// Based on the SafeMath library by the OpenZeppelin team.
// Copyright (c) 2016 Smart Contract Solutions, Inc.
// https://github.com/OpenZeppelin/zeppelin-solidity
// The MIT License.
// ----------------------------------------------------------------------------

import "./AddressArrayLib.sol";

contract AddressArrayLibMock {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    AddressArrayLib.AddressArray addressArray;


    function add(address value) public returns (uint){
        return addressArray.add(value);
    }

    function removeByValue(address value) public returns (uint) {

        return addressArray.removeByValue(value);
    }

    function find(address value) public returns (bool, uint) {

        return addressArray.find(value);
    }

    function length() public returns (uint){
        return addressArray.length();
    }

}
