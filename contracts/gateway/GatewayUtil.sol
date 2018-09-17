pragma solidity ^0.4.23;

import './BytesLib.sol';

/**
 *  @title GatewayUtil contract.
 *
 *  @notice GatewayUtil contains general purpose functions shared between
 *  gateway and co-gateway.
 */
contract GatewayUtil {


    /* Internal functions */

    /**
     * @notice Returns the codehash of external library by trimming first
     *         21 bytes. From 21 bytes first bytes is jump opcode and rest
     *         20 bytes is address of library.
     *
     * @param _libraryAddress Address of library contract.
     *
     * @return codeHash_ return code hash of library
     */
    function libraryCodeHash(address _libraryAddress)
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

    /**
     * @notice Returns the codehash of the contract
     *
     * @param _contractAddress Address of  contract.
     *
     * @return codehash_ return code hash of contract
     */
    function getCode(address _contractAddress)
        view
        internal
        returns (bytes codeHash_)
    {
        assembly {
        // retrieve the size of the code, this needs assembly
            let size := extcodesize(_contractAddress)
        // allocate output byte array - this could also be done without assembly
        // by using o_code = new bytes(size)
            codeHash_ := mload(0x40)
        // new "memory end" including padding
            mstore(0x40, add(codeHash_, and(add(add(size, 0x20), 0x1f), not(0x1f))))
        // store length in memory
            mstore(codeHash_, size)
        // actually retrieve the code, this needs assembly
            extcodecopy(_contractAddress, add(codeHash_, 0x20), 0, size)
        }
    }

}
