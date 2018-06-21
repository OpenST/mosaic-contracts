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

    /** @dev    add element to array
     *
     *  @param  array of address
     *  @param  value which will be added to array
     *
     *  @return new length of array
     */
    function push(AddressArray storage array, address value) internal  returns (uint256 length){

        return array.addresses.push(value);
    }

    /** @dev     remove first occurrence of element from array by value
     *
     *  @param   array of address
     *  @param   value which will be removed from
     *
     *  @return  new length of array
     */
    function removeByValue(AddressArray storage array, address value) internal returns (bool isElementPresent) {

        uint256 index = 0;

        (isElementPresent, index) = find(array, value);

        if (isElementPresent) {
            removeByIndex(array, index);
        }
        return isElementPresent;
    }

    /** @dev     search first occurrence of element in array
     *
     *  @param   array of address
     *  @param   value which will be searched
     *
     *  @return  bool to check value exist in array
     *  @return  index of element
     */
    function find(AddressArray storage array, address value) internal view returns (bool isElementPresent, uint256 index) {

        while (index < array.addresses.length && !(isElementPresent = (array.addresses[index] == value))) {
            index++;
        }
        return (isElementPresent, index);
    }

    /**
     *  @dev     length of array
     *
     *  @param   array of address
     *
     *  @return  length of array
     */
    function length(AddressArray storage array) internal view returns (uint256 length){

        return array.addresses.length;
    }

    /** @dev     remove element in array by index
     *
     *  @param   array of address
     *  @param   index of element
     *
     *  @return  new length of array
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
