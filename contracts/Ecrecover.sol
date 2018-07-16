pragma solidity ^0.4.23;

contract Ecrecover {

    function testRecovery(bytes32 h, uint8 v, bytes32 r, bytes32 s) returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = sha3(prefix, h);
        address addr = ecrecover(prefixedHash, v, r, s);

        return addr;
    }



}
