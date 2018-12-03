pragma solidity ^0.5.0;

import "../gateway/EIP20Gateway.sol";
import "../gateway/MessageBus.sol";

contract MockEIP20Gateway is EIP20Gateway {

    MessageBus messageBus;
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _core,
            _bounty,
            _organisation
        )
        public
    {

    }
}
