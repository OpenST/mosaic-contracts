pragma solidity ^0.4.23;

import "./BlockStoreInterface.sol";

contract AddressStore {

    bytes32 constant POLLING_PLACE_CODE_HASH = "";
    bytes32 constant AUX_BLOCKSTORE_CODE_HASH = "";
    bytes32 constant ORIGIN_BLOCKSTORE_CODE_HASH = "";
    bytes32 constant KERNEL_GATEWAY_CODE_HASH = "";

    address originCore;
    bytes20 originCoreIdentifier;
    bytes20 auxiliaryCoreIdentifier;

    address pollingPlace;
    address originBlockStore;
    address auxiliaryBlockStore;
    address kernelGateway;

    constructor(
        address _originCore,
        bytes20 _originCoreIdentifier,
        bytes20 _auxiliaryCoreIdentifier
    )
        public
    {

        require(
            _originCore != address(0),
            "Origin address must not be zero."
        );

        require(
            _originCoreIdentifier != _auxiliaryCoreIdentifier,
            "Origin and auxiliary core identifier must not be same."
        );

        originCore = _originCore;
        originCoreIdentifier = _originCoreIdentifier;
        auxiliaryCoreIdentifier = _auxiliaryCoreIdentifier;

    }

    function registerAddress()
        external
        returns (bool success_)
    {
        bytes memory code = getCode(msg.sender);
        bytes32 codeHash = keccak256(abi.encodePacked(code));

        require(
            codeHash != bytes32(0),
            "Code hash must not be zero"
        );

        success_ = true;

        if(codeHash == POLLING_PLACE_CODE_HASH) {
            pollingPlace = msg.sender;
        } else if(codeHash == AUX_BLOCKSTORE_CODE_HASH) {
            require(
                BlockStoreInterface(msg.sender).getCoreIdentifier() ==
                    auxiliaryCoreIdentifier,
                "Core identifier for auxiliary block store must be equal to address store's auxiliary core identifier"
            );
            auxiliaryBlockStore = msg.sender;
        } else if(codeHash == ORIGIN_BLOCKSTORE_CODE_HASH) {
            require(
                BlockStoreInterface(msg.sender).getCoreIdentifier() ==
                originCoreIdentifier,
                "Core identifier for origin block store must be equal to address store's origin core identifier"
            );
            originBlockStore = msg.sender;
        } else if(codeHash == KERNEL_GATEWAY_CODE_HASH) {
            kernelGateway = msg.sender;
        } else {
            success_ = false;
        }

    }



    /**
     * @notice Returns the codehash of the contract
     *
     * @param _contractAddress Address of  contract.
     *
     * @return codehash_ return code hash of contract
     */
    function getCode(address _contractAddress)
    view
    public
    returns (bytes codeHash_)
    {
        assembly {
        // retrieve the size of the code, this needs assembly
            let size := extcodesize(_contractAddress)
        // allocate output byte array - this could also be done without assembly
        // by using o_code = new bytes(size)
            codeHash_ := mload(0x40)
        // new "memory end" including padding
            mstore(0x40, add(codeHash_, and(add(add(size, 0x20), 0x1f), not(0x1f))))
        // store length in memory
            mstore(codeHash_, size)
        // actually retrieve the code, this needs assembly
            extcodecopy(_contractAddress, add(codeHash_, 0x20), 0, size)
        }
    }

}
