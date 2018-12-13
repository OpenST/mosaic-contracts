pragma solidity ^0.5.0;

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


import "../../lib/MockMessageBus.sol";
import "../../gateway/GatewayBase.sol";

/**
 * @title Stub data used across tests.
 */
contract KeyValueStoreStub {

    mapping(bytes32 => uint256) public uintStorage;
    mapping(bytes32 => address) public addressStorage;
    mapping(bytes32 => bytes32) public bytes32Storage;
    mapping(bytes32 => bytes) public bytesStorage;

    MockMessageBus.MessageBox messageBox;
    MockMessageBus.Message message;

    bytes32 constant public STAKE_TYPEHASH = keccak256(
        abi.encode(
            "Stake(uint256 amount,address beneficiary,MockMessageBus.Message message)"
        )
    );

    /* Special Functions */

    /**
     * @notice contract constructor.
     *
     * @dev It sets the stub data based on their data type in respective
     *      mapping
     */
    constructor() internal {
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
            keccak256(abi.encodePacked("secret"))
        );
        setBytes32(
            "HASH_LOCK",
            keccak256(abi.encodePacked(getBytes32("UNLOCK_SECRET")))
        );
        setBytes32(
            "INTENT_HASH",
            keccak256(abi.encodePacked("intent"))
        );
        setBytes32(
            "HASHED_MESSAGE_TO_SIGN",
            0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a
        );

        setBytes32(
            "MESSAGE_BUS_DIGEST",
            MockMessageBus.messageDigest(
                STAKE_TYPEHASH,
                getBytes32("INTENT_HASH"),
                getUint256("NONCE"),
                getUint256("GAS_PRICE"),
                getUint256("GAS_LIMIT")
            )
        );

        setBytes32("STAKE_TYPEHASH", STAKE_TYPEHASH);

        setBytes32(
            "STORAGE_ROOT",
            0x9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771
        );

        // Set Message
        message = MockMessageBus.Message({
            intentHash : getBytes32("INTENT_HASH"),
            nonce : getUint256("NONCE"),
            gasPrice : getUint256("GAS_PRICE"),
            gasLimit : getUint256("GAS_LIMIT"),
            sender : getAddress("SENDER"),
            hashLock : getBytes32("HASH_LOCK"),
            gasConsumed: getUint256("GAS_CONSUMED")
        });

        // Store bytes
        setBytes(
            "SIGNATURE",
            "b3ea4cd2196f5723de9bda449c8bb7745a444383f27586148a358ab855aed1bd4b9b3ebf0920982d016b6b5eaa00a83ddf1b07bb9b154677f005d08db5c5240d00"
        );

        setBytes(
            "RLP_PARENT_NODES",
            "f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7"
        );

    }

    /* Getter Public Functions */

    /**
     * @notice it returns uint256 data from uintStorage mapping.
     *
     * @param key mapping key for which uintStorage to look up.
     *
     * @return Stored uint for the key.
     */
    function getUint256(string memory key) internal view returns (uint256) {
        return uintStorage[hashed(key)];
    }

    /**
     * @notice it returns address from addressStorage mapping.
     *
     * @param key mapping key for which addressStorage to look up.
     *
     * @return Stored address for the key.
     */
    function getAddress(string memory key) internal view returns (address) {
        return addressStorage[hashed(key)];
    }

    /**
     * @notice it returns bytes32 from bytes32Storage mapping.
     *
     * @param key mapping key for which bytes32Storage to look up.
     *
     * @return Stored bytes32 for the key.
     */
    function getBytes32(string memory key) internal view returns (bytes32) {
        return bytes32Storage[hashed(key)];
    }

    /**
     * @notice it returns bytes from bytesStorage mapping.
     *
     * @param key mapping key for which bytesStorage to look up.
     *
     * @return Stored bytes for the key.
     */
    function getBytes(string memory key) internal view returns (bytes storage) {
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
    function setUint256(string memory key, uint256 value) internal {
        uintStorage[hashed(key)] = value;
    }

    /**
     * @notice it sets address in addressStorage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in addressStorage mapping.
     *
     */
    function setAddress(string memory key, address value) internal {
        addressStorage[hashed(key)] = value;
    }

    /**
     * @notice it sets bytes32 data in bytes32Storage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in bytes32Storage mapping.
     *
     */
    function setBytes32(string memory key, bytes32 value) internal {
        bytes32Storage[hashed(key)] = value;
    }

    /**
     * @notice it sets bytes data in bytesStorage mapping.
     *
     * @param key value is set for this key.
     * @param value to be set in bytesStorage mapping.
     *
     */
    function setBytes(string memory key, bytes memory value) internal {
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
    function hashed(string memory data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }

}
