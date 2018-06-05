pragma solidity ^0.4.23;

library AddressArrayLib {

    struct AddressArray {
        address[] addresses;
    }

    function add(AddressArray storage array, address value) internal returns (uint){
        array.addresses.push(value);
        return array.addresses.length;
    }

    function removeByValue(AddressArray storage array, address value) internal view returns (uint) {
        uint i = find(array, value);
        removeByIndex(array, i);
        return array.addresses.length;
    }


    function find(AddressArray storage array, address value) internal view returns (uint) {
        uint i = 0;
        while (array.addresses[i] != value) {
            i++;
        }
        return i;
    }

    function removeByIndex(AddressArray storage array, uint i) internal view {
        while (i < array.addresses.length - 1) {
            array.addresses[i] = array.addresses[i + 1];
            i++;
        }
        array.addresses.length--;
    }

    function length(AddressArray storage array) internal view returns(uint){
        return array.addresses.length;
    }
}
