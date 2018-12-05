pragma solidity ^0.5.0;

import "../../StateRootInterface.sol";
import "../../gateway/EIP20Gateway.sol";
import "../../lib/OrganizationInterface.sol";

contract MockEIP20Gateway is EIP20Gateway {

    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        StateRootInterface _core,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _messageBus
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _core,
            _bounty,
            _organization,
            _messageBus
        )
        public
    {
        linked = true;
    }
}
