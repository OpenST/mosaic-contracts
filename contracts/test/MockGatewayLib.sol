pragma solidity ^0.5.0;

/**
 * @title MockGatewayLib contract
 *
 * @notice Mocks the GatewayLib library. Used only for testing.
 */
library MockGatewayLib {

    /**
     * @notice Mock Merkle proof verification of account.
     *
     * @return bytes32 Mocked value of storage path of the variable.
     */
    function proveAccount(
        bytes calldata,
        bytes calldata,
        bytes calldata,
        bytes32
    )
        external
        pure
        returns (bytes32 storageRoot_)
    {
        return bytes32(0x8c0ee0843488170879578464b1cadcdb7377efa787372405ff373e4cec6a56db);
    }

}
