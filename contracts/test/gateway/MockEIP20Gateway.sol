pragma solidity ^0.5.0;

import "../../gateway/EIP20Gateway.sol";
import "../../lib/IsWorkerInterface.sol";

contract MockEIP20Gateway is EIP20Gateway {

    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        CoreInterface _core,
        uint256 _bounty,
        IsWorkerInterface _workerManager,
        address _messageBus
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _core,
            _bounty,
            _workerManager,
            _messageBus
        )
        public
    {
        linked = true;
    }
}
