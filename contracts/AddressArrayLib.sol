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

    /*  @title -  Add element to array
     *  @Param - array
     *  @Param - value which will be added to array
     *  @Returns: new length of array
     */
    function add(AddressArray storage array, address value) internal view returns (uint){
        require(value != address(0), "value should be non zero");

        array.addresses.push(value);
        return array.addresses.length;
    }

    /*  @title -  Remove first occurrence of element from array by value
     *  @Param - array
     *  @Param - value which will be removed from
     *  @Returns: new length of array
     */
    function removeByValue(AddressArray storage array, address value) internal view returns (uint) {
        require(value != address(0), "value should be non zero");

        uint256 index;
        bool isElementPresent;

        (isElementPresent, index) = find(array, value);

        require(isElementPresent, "Element doesn't exist in Array");

        removeByIndex(array, index);
        return array.addresses.length;
    }

    /*  @title - Search element in array
     *  @Param - array
     *  @Param - value which will be searched
     *  @Returns - bool to check value exist in array
     *  @Returns - index of element
     */
    function find(AddressArray storage array, address value) internal view returns (bool, uint) {
        require(value != address(0), "value should be non zero");

        uint256 i = 0;
        bool isElementPresent = false;

        while (i < array.addresses.length && !(isElementPresent = (array.addresses[i] == value))) {
            i++;
        }
        return (isElementPresent, i);
    }

    /*  @title - length of array
     *  @Param - array
     *  @Returns - length of array
     */
    function length(AddressArray storage array) internal view returns(uint){
        return array.addresses.length;
    }

    /*  @title - Remove element in array by index
     *  @Param - array
     *  @Param - index of element
     *  @Returns - new length of array
     */
    function removeByIndex(AddressArray storage array, uint256 i) private view {
        require(i >= 0, "Index should be greater than zero");
        require(i < array.addresses.length, "Index should be less than length");

        while (i < array.addresses.length - 1) {
            array.addresses[i] = array.addresses[i + 1];
            i++;
        }
        array.addresses.length--;
    }
}
