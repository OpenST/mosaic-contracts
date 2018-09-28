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


import "../../contracts/gateway/MessageBus.sol";
import "../../contracts/gateway/GatewayBase.sol";

/**
 * @title Stub data used across tests.
 */
contract KeyValueStoreStub {

    mapping(bytes32 => uint256) public uintStorage;
    mapping(bytes32 => address) public addressStorage;
    mapping(bytes32 => bytes32) public bytes32Storage;
    mapping(bytes32 => bytes) public bytesStorage;

    MessageBus.MessageBox messageBox;
    MessageBus.Message message;

    bytes32 constant public STAKE_TYPEHASH = keccak256(
        abi.encode(
            "Stake(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    /* Special Functions */

    /**
     * @notice contract constructor.
     *
     * @dev It sets the stub data based on their data type in respective
     *      mapping
     */
    constructor()
        internal
    {
        // Stores uint256
        setUint256("NONCE", 1);
        setUint256("GAS_PRICE", 0x12A05F200);
        setUint256("GAS_LIMIT", 0x12A05F200);
        setUint256("GAS_CONSUMED", 0);

        // Store Address
        setAddress(
            "SENDER",
            address(0x8014986b452DE9f00ff9B036dcBe522f918E2fE4)
        );

        // Store byte32
        setBytes32(
            "UNLOCK_SECRET",
            keccak256(abi.encodePacked('secret'))
        );
        setBytes32(
            "HASH_LOCK",
            keccak256(abi.encodePacked(getBytes32("UNLOCK_SECRET")))
        );
        setBytes32(
            "INTENT_HASH",
            keccak256(abi.encodePacked('intent'))
        );
        setBytes32(
            "HASHED_MESSAGE_TO_SIGN",
            0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a
        );

        setBytes32(
            "MESSAGE_BUS_DIGEST",
            MessageBus.messageDigest(
                STAKE_TYPEHASH,
                getBytes32("INTENT_HASH"),
                getUint256("NONCE"),
                getUint256("GAS_PRICE"),
                getUint256("GAS_LIMIT")
            )
        );

        setBytes32("STAKE_TYPEHASH", STAKE_TYPEHASH);

        // Set Message
        message = MessageBus.Message({
            intentHash : getBytes32("INTENT_HASH"),
            nonce : getUint256("NONCE"),
            gasPrice : getUint256("GAS_PRICE"),
            gasLimit : getUint256("GAS_LIMIT"),
            sender : getAddress("SENDER"),
            hashLock : getBytes32("HASH_LOCK"),
            gasConsumed: getUint256("GAS_CONSUMED")
        });
    }

    /* Getter Public Functions */

    /**
     * @notice it returns uint256 data from uintStorage mapping.
     *
     * @param key mapping key for which uintStorage to look up.
     *
     * @return Stored uint for the key.
     */
    function getUint256(string key)
        internal
        view
        returns (uint256)
    {
        return uintStorage[hashed(key)];
    }

    /**
     * @notice it returns address from addressStorage mapping.
     *
     * @param key mapping key for which addressStorage to look up.
     *
     * @return Stored address for the key.
     */
    function getAddress(string key)
        internal
        view
        returns (address)
    {
        return addressStorage[hashed(key)];
    }

    /**
     * @notice it returns bytes32 from bytes32Storage mapping.
     *
     * @param key mapping key for which bytes32Storage to look up.
     *
     * @return Stored bytes32 for the key.
     */
    function getBytes32(string key)
        internal
        view
        returns (bytes32)
    {
        return bytes32Storage[hashed(key)];
    }

    /**
     * @notice it returns bytes from bytesStorage mapping.
     *
     * @param key mapping key for which bytesStorage to look up.
     *
     * @return Stored bytes for the key.
     */
    function getBytes(string key)
        internal
        view
        returns (bytes)
    {
        return bytesStorage[hashed(key)];
    }

    /* Setter Public Functions */

    /**
     * @notice it sets address in uintStorage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in uintStorage mapping.
     *
     */
    function setUint256(string key, uint256 value)
        internal
    {
        uintStorage[hashed(key)] = value;
    }

    /**
     * @notice it sets address in addressStorage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in addressStorage mapping.
     *
     */
    function setAddress(string key, address value)
        internal
    {
        addressStorage[hashed(key)] = value;
    }

    /**
     * @notice it sets bytes32 data in bytes32Storage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in bytes32Storage mapping.
     *
     */
    function setBytes32(string key, bytes32 value)
        internal
    {
        bytes32Storage[hashed(key)] = value;
    }

    /**
     * @notice it sets bytes data in bytesStorage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in bytesStorage mapping.
     *
     */
    function setBytes(string key, bytes value)
        internal
    {
        bytesStorage[hashed(key)] = value;
    }

    /* Private Functions */

    /**
     * @notice it hashes the input after doing abi encodePacked.
     *
     * @param data to hash.
     *
     * @return hashed data.
     */
    function hashed(string data)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(data));
    }

}