pragma solidity ^0.5.0;

import "../gateway/EIP20CoGateway.sol";

/**
 * @title MockEIP20CoGateway contract.
 *
 * @notice Used for test only.
 */
contract MockEIP20CoGateway is EIP20CoGateway {

    /* Constructor */

    /**
     * @notice Initialise the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         minting and redeeming.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organisation Organisation address.
     * @param _gateway Gateway contract address.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation,
        address _gateway
    )
        EIP20CoGateway(
            _valueToken,
            _utilityToken,
            _core,
            _bounty,
            _organisation,
            _gateway
        )
        public
    {

    }


    /* Public functions */

    function setOutboxStatus(bytes32 messageHash) public {

        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Declared;

    }

}

