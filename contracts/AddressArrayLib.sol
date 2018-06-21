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

    /**
     *  @notice Adds element into the array
     *
     *  @param  array Array of address to add new elements
     *  @param  value New element to be added into array
     *
     *  @return length  of array after adding the element
     */
    function push(AddressArray storage array, address value) internal returns (uint256 length){

        return array.addresses.push(value);
    }

    /**
     *  @notice  Remove first occurrence of element from array by value
     *
     *  @param   array Array of address from which element is removed
     *  @param   value element which will be removed from the array
     *
     *  @return  length of array after removing the element
     */
    function removeByValue(AddressArray storage array, address value) internal returns (bool isElementPresent) {

        uint256 index = 0;

        (isElementPresent, index) = find(array, value);

        if (isElementPresent) {
            removeByIndex(array, index);
        }
        return isElementPresent;
    }

    /**
     *   @notice  Search first occurrence of element from the array
     *
     *  @param   array Array of address from which element is searched
     *  @param   value element which will be searched from the array
     *
     *  @return  bool return true if element exists in the array else false
     *  @return  index position of value in the array
     */
    function find(AddressArray storage array, address value) internal view returns (bool isElementPresent, uint256 index) {

        while (index < array.addresses.length && !(isElementPresent = (array.addresses[index] == value))) {
            index++;
        }
        return (isElementPresent, index);
    }

    /**
     *  @notice  Length of array
     *
     *  @param   array Array of address
     *
     *  @return  length of array
     */
    function length(AddressArray storage array) internal view returns (uint256 length){

        return array.addresses.length;
    }

    /**
     *  @notice  Remove element in array by index
     *
     *  @param   array Array of address from which element is removed
     *  @param   index index which will be removed from the array
     *
     *  @return  length of array after removing the element
     */
    function removeByIndex(AddressArray storage array, uint256 index) private  {
        
        require(index >= 0, "Index should be greater than zero");
        require(index < array.addresses.length, "Index should be less than length");

        while (index < array.addresses.length - 1) {
            array.addresses[index] = array.addresses[index + 1];
            index++;
        }
        array.addresses.length--;
    }
}
