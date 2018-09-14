pragma solidity ^0.4.23;

import './BytesLib.sol';

library Util {


    function getLibraryContractCodeHash(address _libraryAddress)
    view
    internal
    returns (bytes32)
    {
        bytes memory code = getCode(_libraryAddress);
        //trim the first 21 bytes in library code.
        //first byte is 0x73 opcode which means load next 20 bytes in to the stack and next 20 bytes are library address
        bytes memory trimmedCode = BytesLib.slice(code, 21, code.length - 21);
        return keccak256(abi.encodePacked(trimmedCode));

    }

    function getCode(address _address)
    view
    internal
    returns (bytes o_code)
    {
        assembly {
        // retrieve the size of the code, this needs assembly
            let size := extcodesize(_address)
        // allocate output byte array - this could also be done without assembly
        // by using o_code = new bytes(size)
            o_code := mload(0x40)
        // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
        // store length in memory
            mstore(o_code, size)
        // actually retrieve the code, this needs assembly
            extcodecopy(_address, add(o_code, 0x20), 0, size)
        }
    }

}
