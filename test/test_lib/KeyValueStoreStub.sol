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

import "../../contracts/gateway/Hasher.sol";
import "../../contracts/gateway/MessageBus.sol";

/**
 * @title Stub data used across tests.
 */
contract KeyValueStoreStub {

    mapping(bytes32 => uint256) public uintStorage;
    mapping(bytes32 => address) public addressStorage;
    mapping(bytes32 => bytes32) public bytes32Storage;
    mapping(bytes32 => bytes) public bytesStorage;

    Hasher hasher = new Hasher();
    MessageBus.MessageBox messageBox;
    MessageBus.Message message;

    function KeyValueStoreStub()
        public
    {
        // Stores uint256
        setUint("NONCE", 1);
        setUint("GAS_PRICE", 0x12A05F200);
        setUint("GAS_LIMIT", 0x12A05F200);
        setUint("GAS_CONSUMED", 0);

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
                hasher.stakeTypeHash(),
                getBytes32("INTENT_HASH"),
                getUint("NONCE"),
                getUint("GAS_PRICE"),
                getUint("GAS_LIMIT")
        ));

        // Set Message
        message = MessageBus.Message({
            intentHash : getBytes32("INTENT_HASH"),
            nonce : getUint("NONCE"),
            gasPrice : getUint("GAS_PRICE"),
            gasLimit : getUint("GAS_LIMIT"),
            sender : getAddress("SENDER"),
            hashLock : getBytes32("HASH_LOCK"),
            gasConsumed: getUint("GAS_CONSUMED")
        });
    }

    /* Getter Public Functions */

    function getUint(string key)
        internal
        returns (uint256)
    {
        return uintStorage[hashed(key)];
    }

    function getAddress(string key)
        internal
        returns (address)
    {
        return addressStorage[hashed(key)];
    }

    function getBytes32(string key)
        internal
        returns (bytes32)
    {
        return bytes32Storage[hashed(key)];
    }

    function getBytes(string key)
        internal
        returns (bytes)
    {
        return bytesStorage[hashed(key)];
    }

    /* Setter Public Functions */

    function setUint(string key, uint256 value)
        internal
    {
        uintStorage[hashed(key)] = value;
    }

    function setAddress(string key, address value)
        internal
    {
        addressStorage[hashed(key)] = value;
    }

    function setBytes32(string key, bytes32 value)
        internal
    {
        bytes32Storage[hashed(key)] = value;
    }

    function setBytes(string key, bytes value)
        internal
    {
        bytesStorage[hashed(key)] = value;
    }

    /* Private Functions */

    function hashed(string key)
        internal
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(key));
    }

}