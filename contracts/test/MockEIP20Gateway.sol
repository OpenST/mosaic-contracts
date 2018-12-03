pragma solidity ^0.5.0;

import "../gateway/EIP20Gateway.sol";

contract MockEIP20Gateway is EIP20Gateway {

    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation,
        address _messageBus
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _core,
            _bounty,
            _organisation,
            _messageBus
        )
        public
    {
        linked = true;
    }
}
