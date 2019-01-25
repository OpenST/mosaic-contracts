// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const colors = require('colors/safe');

/**
 * Return a promise that resolves once a transaction has been mined.
 *
 * @param {object} web3 The web3 instance to use.
 * @param {string} txHash The transaction hash of the transaction to wait for.
 * @param {number} [interval=500] The interval of how often we want to check
 *                 the transaction status.
 */
const waitForTransactionReceiptMined = (web3, txHash, interval = 500) => {
    const transactionReceiptAsync = (resolve, reject) => {
        web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
            if (error) {
                reject(error);
            } else if (receipt == null) {
                setTimeout(
                    () => transactionReceiptAsync(resolve, reject),
                    interval,
                );
            } else {
                resolve(receipt);
            }
        });
    };

    if (Array.isArray(txHash)) {
        return Promise.all(txHash.map(
            oneTxHash => waitForTransactionReceiptMined(web3, oneTxHash, interval),
        ));
    }
    if (typeof txHash === 'string') {
        return new Promise(transactionReceiptAsync);
    }
    throw new Error('Invalid Type: ' + txHash);
};

/**
 * A Signer that assumes that the accounts used to sign the messages are
 * permanently unlocked in the web3 instance it points to.
 */
class UnlockedWeb3Signer {
    /**
     * @param {object} web3 The web3 instance to use.
     */
    constructor(web3) {
        this.web3 = web3;

        this.signTransaction = this.signTransaction.bind(this);
    }

    /**
     * @param {object} transactionObject The transaction object to sign.
     *                 See {@link https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction}
     */
    signTransaction(transactionObject) {
        return this.web3.eth.signTransaction(transactionObject);
    }
}

/**
 * Send a signed transaction and wait for it to be mined,
 * and optionally log the progress.
 *
 * @param {object} web3 The web3 used to send the transaction.
 * @param {object} deploymentObject The deploymentObject for which the signed
 *                 transaction was generated.
 * @param {string} rawTransaction The signed raw transaction to send.
 * @param {bool} loggingActive Whether to log the progress of the deployment.
 *
 * @returns {Promise.<string>} The address of the deployed contract.
 */
const sendDeploymentTransaction = (
    web3,
    deploymentObject,
    rawTransaction,
    loggingActive,
) => {
    return web3.eth.sendSignedTransaction(rawTransaction)
        .then((receipt) => {
            if (loggingActive) {
                console.log(colors.dim(`Deploying ${deploymentObject.contractName} (tx ${receipt.transactionHash})`));
            }
            return waitForTransactionReceiptMined(web3, receipt.transactionHash, 10);
        })
        .then((receipt) => {
            if (loggingActive) {
                console.log(colors.green(`Deployed ${colors.underline.green(deploymentObject.contractName)} at ${receipt.contractAddress}`));
                if (receipt.contractAddress.toLowerCase() !== deploymentObject.address) {
                    console.warn(`"${deploymentObject.contractName}" was not deployed at the predicted address ${deploymentObject.address})`);
                }
            }
            return receipt.contractAddress.toLowerCase();
        });
};

/**
 * Deploy the provided deployment objects, as provided by
 * {@link ContractRegistry#toLiveTransactionObjects}, in sequence.
 *
 * @param {object} signer The signer used to sign the transactions.
 *                 See {@link UnlockedWeb3Signer}.
 * @param {object} web3 The web3 instance used to send the deployment transactions.
 * @param {Array.<object>} deploymentObjects The deployment objects to deploy.
 * @param {bool} options.log Whether to log the progress of the deployment.
 * @param {string} options.gas The amount of gas to use for the deployment transactions.
 *                 If omitted, it will be calculated via `web3.eth.estimateGas`.
 * @param {string} options.gasPrice The gas price to use for the deployment transactions.
 *                 If omitted, it will be calculated via `web3.eth.getGasPrice`.
 */
const deployContracts = async (
    signer,
    web3,
    deploymentObjects,
    options = {
        log: false,
    },
) => {
    // allows us to run promises in sequence
    const asyncForEach = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    };

    const _options = options;
    const loggingActive = _options.log;
    delete _options.log;

    const contractAddresses = {};
    await asyncForEach(deploymentObjects, async (deploymentObject) => {
        let { gas, gasPrice } = _options;
        if (!gas) {
            gas = await web3.eth.estimateGas(deploymentObject.transactionObject);
        }
        if (!gasPrice) {
            gasPrice = await web3.eth.getGasPrice();
        }

        return signer.signTransaction(Object.assign(
            deploymentObject.transactionObject,
            _options,
            {
                gas,
                gasPrice,
            },
        ))
            .then(signedTransaction => sendDeploymentTransaction(
                web3,
                deploymentObject,
                signedTransaction.raw,
                loggingActive,
            ))
            .then((contractAddress) => {
                contractAddresses[deploymentObject.contractName] = contractAddress;
            });
    });

    return contractAddresses;
};

module.exports = {
    deployContracts,
    UnlockedWeb3Signer,
};
