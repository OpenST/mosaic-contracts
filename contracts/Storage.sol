/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.17;

contract Storage {
    uint pos0;
    mapping(address => uint) pos1;

    function Storage() {
        pos0 = 1234;
        pos1[msg.sender] = 5678;
    }
}