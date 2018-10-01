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
// ----------------------------------------------------------------------------
// Test: lib/gateway_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

var Web3 = require('web3'),
    web3 = new Web3("http://localhost:8545");


const hashLock = require("../../lib/hash_lock");
const NullAddress = "0x0000000000000000000000000000000000000000";
var ResultType = {
    FAIL:0,
    SUCCESS:1
};
Object.freeze(ResultType);

/*
 *  Tracking Gas Usage
 */
const receipts = [];

const Utils = function() {};

Utils.prototype = {
    logResponse: function(response, description){
        receipts.push({
            receipt: response.receipt,
            description: description,
            response: response
        });
    },

    logReceipt:function(receipt, description){
        receipts.push({
            receipt: receipt,
            description: description,
            response: null
        });
    },

    logTransaction: async function(hash, description) {
        const receipt = await web3.eth.getTransactionReceipt(hash);
        await this.logReceipt(receipt, description)
    },

    printGasStatistics: function() {
        var totalGasUsed = 0;

        console.log("  -----------------------------------------------------");
        console.log("  Report gas usage\n");

        for (i = 0; i < receipts.length; i++) {
            const entry = receipts[i];

            totalGasUsed += entry.receipt.gasUsed;

            console.log("  " +
                entry.description.padEnd(45) +
                entry.receipt.gasUsed
            );
        }

        console.log("  -----------------------------------------------------");
        console.log("  " +
            "Total gas logged: ".padEnd(45) +
            totalGasUsed + "\n"
        )
    },

    clearReceipts: function() {
        receipts.splice(0, receipts.length);
    },

    /*
     *  General event checks
     */
    expectNoEvents: function(result) {
        Assert.equal(
            result.receipt.logs.length,
            0,
            "expected empty array of logs"
        );
    },

    /*
     *  Basic Ethereum checks
     */

    /// @dev Compare to null address
    isNullAddress: function (address) {
        Assert.strictEqual(
            typeof address,
            'string',
            `address must be of type 'string'`
        );
        return (address == NullAddress);
    },

    /// @dev Expect failure from invalid opcode or out of gas,
    ///      but returns error instead
    expectThrow: async function(promise) {
        try {
            await promise;
        } catch (error) {
            const invalidOpcode = error.message.search('invalid opcode') > -1;

            const outOfGas = error.message.search('out of gas') > -1;

            // Latest TestRPC has trouble with require
            const revertInstead = error.message.search('revert') > -1;

            assert(
                invalidOpcode ||
                outOfGas ||
                revertInstead,
                `Expected throw, but got ${error} instead`
            );

            return;
        }

        assert(false, "Did not throw as expected");
    },


    /// @dev Expect failure from revert,
    ///      but returns error instead
    expectRevert: async function(promise) {
        try {
            await promise;
        } catch (error) {
            // TODO: Truffle v5 will support require messages with web3 1.0
            // and we can
            // check for a specific message.
            assert(
                error.message.search('revert') > -1,
                'The contract should revert. Instead: ' + error.message
            );

            return;
        }

        assert(false, "Did not revert as expected.");
    },

    /// @dev Get account balance
    getBalance: function(address) {
        return new Promise(function (resolve, reject) {
            web3.eth.getBalance(address, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            })
        })
    },

    /// @dev Get gas price
    getGasPrice: function() {
        return new Promise(function (resolve, reject) {
            web3.eth.getGasPrice(function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            })
        })
    },

    //Get latest hash
    generateHashLock: function() {
        return hashLock.getHashLock();
    },

    signHash: async function(
        typeHash,
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        signerAddress) {

        let digest = web3.utils.soliditySha3(
            { t: 'bytes32', v: typeHash },
            { t: 'bytes32', v: intentHash },
            { t: 'uint256', v: nonce },
            { t: 'uint256', v: gasPrice },
            { t: 'uint256', v: gasLimit }
        );
        let signature = await web3.eth.sign(digest, signerAddress);
        return {
            signature: signature,
            digest: digest
        };
    },

    validateEvents: function (eventLogs, expectedData) {
        assert.equal(
            eventLogs.length,
            Object.keys(expectedData).length,
            "Number of events emitted must match expected event counts"
        );

        eventLogs.forEach(function (event) {
            var eventName = event.event;
            var eventData = event.args.Result;
            var eventExpectedData = expectedData[eventName];
            assert.notEqual(eventExpectedData, undefined, "Expected event not found");

            for (var key in eventData) {
                assert.equal(
                    eventData[key],
                    eventExpectedData[key],
                    `Event data ${key} must match the expectedData`
                );
            }
        });

    }
};

module.exports = new Utils();
module.exports.ResultType = ResultType;
