pragma solidity ^0.4.23;

import './BytesLib.sol';
import './ProofLib.sol';
import "./CoreInterface.sol";
import "./SafeMath.sol";

/**
 *  @title GatewayBase contract.
 *
 *  @notice GatewayBase contains general purpose functions shared between
 *  gateway and co-gateway contract.
 */
contract GatewayBase {

    using SafeMath for uint256;
    /** Emitted whenever a Gateway/CoGateway contract is proven.
     *	wasAlreadyProved parameter differentiates between first call and replay
     *  call of proveGateway method for same block height
     */
    event GatewayProven(
        address _gateway,
        uint256 _blockHeight,
        bytes32 _storageRoot,
        bool _wasAlreadyProved
    );

    /** address of core contract. */
    CoreInterface public core;

    /** path to prove merkle account proof for CoGateway contract. */
    bytes internal encodedGatewayPath;

    /** Gateway contract address. */
    address public gateway;


    /** Maps blockHeight to storageRoot*/
    mapping(uint256 /* block height */ => bytes32) internal storageRoots;

    constructor(
        CoreInterface _core
    )
    public
    {
        core = _core;

    }

    /* external functions */

    /**
 *  @notice External function prove gateway/co-gateway.
 *
 *  @dev proveGateway can be called by anyone to verify merkle proof of
 *       gateway/co-gateway contract address. Trust factor is brought by stateRoots
 *       mapping. stateRoot is committed in commitStateRoot function by
 *       mosaic process which is a trusted decentralized system running
 *       separately. It's important to note that in replay calls of
 *       proveGateway bytes _rlpParentNodes variable is not validated. In
 *       this case input storage root derived from merkle proof account
 *       nodes is verified with stored storage root of given blockHeight.
 *		 GatewayProven event has parameter wasAlreadyProved to
 *       differentiate between first call and replay calls.
 *
 *  @param _blockHeight Block height at which Gateway/CoGateway is to be proven.
 *  @param _rlpEncodedAccount RLP encoded account node object.
 *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
 *
 *  @return `true` if Gateway account is proved
 */
    function proveGateway(
        uint256 _blockHeight,
        bytes _rlpEncodedAccount,
        bytes _rlpParentNodes
    )
    external
    returns (bool /* success */)
    {
        // _rlpEncodedAccount should be valid
        require(
            _rlpEncodedAccount.length != 0,
            "Length of RLP encoded account is 0"
        );

        // _rlpParentNodes should be valid
        require(
            _rlpParentNodes.length != 0,
            "Length of RLP parent nodes is 0"
        );

        bytes32 stateRoot = core.getStateRoot(_blockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "State root must not be zero"
        );

        // If account already proven for block height
        bytes32 provenStorageRoot = storageRoots[_blockHeight];

        if (provenStorageRoot != bytes32(0)) {

            // Check extracted storage root is matching with existing stored
            // storage root
            require(
                provenStorageRoot == storageRoot,
                "Storage root mismatch when account is already proven"
            );

            // wasAlreadyProved is true here since proveOpenST is replay call
            // for same block height
            emit GatewayProven(
                gateway,
                _blockHeight,
                storageRoot,
                true
            );

            // return true
            return true;
        }

        bytes32 storageRoot = ProofLib.proveAccount(
            _rlpEncodedAccount,
            _rlpParentNodes,
            encodedGatewayPath,
            stateRoot
        );

        storageRoots[_blockHeight] = storageRoot;

        // wasAlreadyProved is false since Gateway is called for the first time
        // for a block height
        emit GatewayProven(
            gateway,
            _blockHeight,
            storageRoot,
            false
        );

        return true;
    }

    /* Internal functions */

    /**
     * @notice Returns the codehash of external library by trimming first
     *         21 bytes. From 21 bytes first bytes is jump opcode and rest
     *         20 bytes is address of library.
     *
     * @param _libraryAddress Address of library contract.
     *
     * @return codeHash_ return code hash of library
     */
    function libraryCodeHash(address _libraryAddress)
    view
    internal
    returns (bytes32)
    {
        bytes memory code = getCode(_libraryAddress);
        //trim the first 21 bytes in library code.
        //first byte is 0x73 opcode which means load next 20 bytes in to the stack and next 20 bytes are library address
        bytes memory trimmedCode = BytesLib.slice(code, 21, code.length - 21);
        return keccak256(abi.encodePacked(trimmedCode));

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
    internal
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

    /**
     * @notice Calculate the fee amount which is rewarded to facilitator for
     *         performing message transfers.
     *
     * @param _gasConsumed gas consumption during message confirmation.
     * @param _gasLimit maximum amount of gas can be used for reward.
     * @param _gasPrice price at which reward is calculated
     * @param _initialGas initial gas at the start of the process
     * @param _estimatedAdditionalGasUsage Estimated gas that will be used
     *
     * @return fee amount
     */
    function feeAmount(
        uint256 _gasConsumed,
        uint256 _gasLimit,
        uint256 _gasPrice,
        uint256 _initialGas,
        uint256 _estimatedAdditionalGasUsage
    )
        view
        internal
        returns (
        uint256 fee_,
        uint256 totalGasConsumed_
        )
    {
        totalGasConsumed_ = _initialGas.sub(
            gasleft()
        ).add(
            _estimatedAdditionalGasUsage
        ).add(
            _gasConsumed
        );

        if (totalGasConsumed_ < _gasLimit) {
            fee_ = totalGasConsumed_.mul(_gasPrice);
        } else {
            fee_ = _gasLimit.mul(_gasPrice);
        }
    }

}
