pragma solidity ^0.5.0;

import "../../gateway/EIP20Gateway.sol";
import "../../lib/IsMemberInterface.sol";

contract MockEIP20Gateway is EIP20Gateway {

    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        CoreInterface _core,
        uint256 _bounty,
        IsMemberInterface _membersManager
    )
        EIP20Gateway(
            _token,
            _baseToken,
            _core,
            _bounty,
            _membersManager
        )
        public
    {}
}
