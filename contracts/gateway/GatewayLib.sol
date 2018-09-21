pragma solidity ^0.4.23;



// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import "./BytesLib.sol";
import "./MerklePatriciaProof.sol";
import "./RLPEncode.sol";
import "./SafeMath.sol";

library GatewayLib {
    using SafeMath for uint256;

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
    public
    returns (bytes32)
    {
        bytes memory code = getCode(_libraryAddress);
        /** trim the first 21 bytes in library code.
         *  first byte is 0x73 opcode which means load next 20 bytes in to the
         *  stack and next 20 bytes are library address
         */
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
     * @return totalGasConsumed_ total gas consumed during message transfer
     */
    function feeAmount(
        uint256 _gasConsumed,
        uint256 _gasLimit,
        uint256 _gasPrice,
        uint256 _initialGas,
        uint256 _estimatedAdditionalGasUsage
    )
    view
    external
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


    /**
     *	@notice Convert bytes32 to bytes
     *
     *	@param _inBytes32 bytes32 value
     *
     *	@return bytes value
     */
    function bytes32ToBytes(bytes32 _inBytes32)
    public
    pure
    returns (bytes)
    {
        bytes memory res = new bytes(32);
        assembly {
            mstore(add(32, res), _inBytes32)
        }
        return res;
    }

    /**
     *	@notice Get the storage path of the variable
     *
     *	@param _index Index of variable
     *	@param _key Key of variable incase of mapping
     *
     *	@return bytes32 Storage path of the variable
     */
    function storageVariablePath(
        uint8 _index,
        bytes32 _key)
    external
    pure
    returns (bytes32 /* storage path */)
    {
        bytes memory indexBytes = BytesLib.leftPad(bytes32ToBytes(bytes32(_index)));
        bytes memory keyBytes = BytesLib.leftPad(bytes32ToBytes(_key));
        bytes memory path = BytesLib.concat(keyBytes, indexBytes);
        return keccak256(abi.encodePacked(keccak256(abi.encodePacked(path))));
    }

    /**
     *	@notice Merkle proof verification of account.
     *
     *	@param _rlpEncodedAccount rlp encoded data of account.
     *	@param _rlpParentNodes path from root node to leaf in merkle tree.
     *	@param _encodedPath encoded path to search account node in merkle tree.
     *	@param _stateRoot state root for given block height.
     *
     *	@return bytes32 Storage path of the variable
     */
    function proveAccount(
        bytes _rlpEncodedAccount,
        bytes _rlpParentNodes,
        bytes _encodedPath,
        bytes32 _stateRoot
    )
    external
    pure
    returns (bytes32 storageRoot_)
    {
        // Decode RLP encoded account value
        RLP.RLPItem memory accountItem = RLP.toRLPItem(_rlpEncodedAccount);
        // Convert to list
        RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);
        // Array 3rd position is storage root
        storageRoot_ = RLP.toBytes32(accountArray[2]);
        // Hash the rlpEncodedValue value
        bytes32 hashedAccount = keccak256(abi.encodePacked(_rlpEncodedAccount));

        // Verify the remote OpenST contract against the committed state root with the state trie Merkle proof
        require(MerklePatriciaProof.verify(hashedAccount, _encodedPath, _rlpParentNodes, _stateRoot), "Account proof is not verified.");

        return storageRoot_;
    }

    /**
     * @notice  function to calculate gateway link intent hash.
     *
     * @param _gateway address of gateway.
     * @param _coGateway address of co-gateway.
     * @param _messageBus address of message bus.
     * @param _bounty amount of bounty used for linking.
     * @param _tokenName  name of branded token.
     * @param _tokenSymbol symbol of branded token.
     * @param _tokenDecimal token decimal of branded token.
     * @param _nonce message nonce.
     * @param _token EIP20 token address.
     *
     * @return bytes32 gateway link intent hash.
     */
    function hashLinkGateway(
        address _gateway,
        address _coGateway,
        address _messageBus,
        uint256 _bounty,
        string _tokenName,
        string _tokenSymbol,
        uint8 _tokenDecimal,
        uint256 _nonce,
        address _token
    )
    external
    view
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _gateway,
                _coGateway,
                libraryCodeHash(_messageBus),
                _bounty,
                _tokenName,
                _tokenSymbol,
                _tokenDecimal,
                _nonce,
                _token
            )
        );
    }

    /**
     * @notice  function to calculate staking intent hash.
     *
     * @param _amount staking amount.
     * @param _beneficiary minting account.
     * @param _staker staking account.
     * @param _stakerNonce nounce of staker.
     * @param _gasPrice price used for reward calculation.
     * @param _gasLimit max limit for reward calculation.
     * @param _token EIP20 token address used for staking.
     *
     * @return bytes32 staking intent hash
     */
    function hashStakingIntent(
        uint256 _amount,
        address _beneficiary,
        address _staker,
        uint256 _stakerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _token
    )
    external
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _amount,
                _beneficiary,
                _staker,
                _stakerNonce,
                _gasPrice,
                _gasLimit,
                _token
            )
        );
    }

    /**
     * @notice function to calculate redemption intent hash.
     *
     * @param _amount redemption amount
     * @param _beneficiary unstake account
     * @param _redeemer redeemer account
     * @param _redeemerNonce nonce of staker
     * @param _gasPrice price used for reward calculation
     * @param _gasLimit max limit for reward calculation
     * @param _token utility token address
     *
     * @return bytes32 redemption intent hash
     */
    function hashRedemptionIntent(
        uint256 _amount,
        address _beneficiary,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _token
    )
    external
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _amount,
                _beneficiary,
                _redeemer,
                _redeemerNonce,
                _gasPrice,
                _gasLimit,
                _token
            )
        );
    }


}
