pragma solidity ^0.4.23;

import "../gateway/GatewayBase.sol";

/**
 *  @title MockGatewayBase contract.
 *
 *  @notice Used to  unit test GatewayBase
 */

contract MockGatewayBase is GatewayBase {

    /** Unlock period for change bounty in block height */
    uint256 public constant BOUNTY_CHANGE_UNLOCK_PERIOD = 1;

    constructor(CoreInterface _core,
        address _messageBus,
        uint256 _bounty,
        address _organisation
    )
        MockGatewayBase(_core, _messageBus, _bounty, _organisation)
    {

    }

}
