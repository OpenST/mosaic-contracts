pragma solidity ^0.4.23;

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
// Common : Address Array
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


library AddressArrayLib {

    struct AddressArray {
        address[] addresses;
    }

    //@dev Add element to array
    function add(AddressArray storage array, address value) internal view returns (uint){
        array.addresses.push(value);
        return array.addresses.length;
    }
    //@dev Remove element from array by value
    function removeByValue(AddressArray storage array, address value) internal view returns (uint) {
        uint index;
        bool isElementPresent;
        (isElementPresent, index) = find(array, value);
        require(isElementPresent, "Element doesn't exist in Array");
        removeByIndex(array, index);
        return array.addresses.length;
    }
    //@dev search element in array and return index
    function find(AddressArray storage array, address value) internal view returns (bool, uint) {
        uint i = 0;
        bool isElementPresent = false;
        while (!(isElementPresent = (array.addresses[i] == value)) && i < array.addresses.length) {
            i++;
        }
        return (isElementPresent, i);
    }
    //@dev remove element for array using index
    function removeByIndex(AddressArray storage array, uint i) internal view {
        while (i < array.addresses.length - 1) {
            array.addresses[i] = array.addresses[i + 1];
            i++;
        }
        array.addresses.length--;
    }
    //@dev return length of array
    function length(AddressArray storage array) internal view returns(uint){
        return array.addresses.length;
    }
}
