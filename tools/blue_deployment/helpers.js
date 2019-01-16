const colors = require('colors/safe');

const getTransactionReceiptMined = (web3, txHash, interval) => {
    const transactionReceiptAsync = function(resolve, reject) {
        web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
            if (error) {
                reject(error);
            } else if (receipt == null) {
                setTimeout(
                    () => transactionReceiptAsync(resolve, reject),
                    interval ? interval : 500);
            } else {
                resolve(receipt);
            }
        });
    };

    if (Array.isArray(txHash)) {
        return Promise.all(txHash.map(
            oneTxHash => getTransactionReceiptMined(web3, oneTxHash, interval)));
    } else if (typeof txHash === "string") {
        return new Promise(transactionReceiptAsync);
    } else {
        throw new Error("Invalid Type: " + txHash);
    }
};

const deployContracts = async (
    signWeb3,
    sendWeb3,
    deploymentObjects,
    options = {
        log: false,
    },
) => {
    const asyncForEach = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    };

    const _options = options;
    const loggingActive = _options.log;
    delete _options.log;

    const contractAddresses = {};
    await asyncForEach(deploymentObjects, (deploymentObject) => {
        return signWeb3.eth.signTransaction(Object.assign(deploymentObject.transactionObject, {
            gasPrice: '1000000000',
            gas: '8000000',
        }))
            .then(signedTransaction => sendWeb3.eth.sendSignedTransaction(signedTransaction.raw))
            .then((receipt) => {
                if (loggingActive) {
                    console.log(colors.dim(`Deploying ${deploymentObject.contractName} (tx ${receipt.transactionHash})`));
                }
                return getTransactionReceiptMined(sendWeb3, receipt.transactionHash, 10);
            })
            .then((receipt) => {
                if (loggingActive) {
                    console.log(colors.green(`Deployed ${colors.underline.green(deploymentObject.contractName)} at ${receipt.contractAddress}`));
                    if (receipt.contractAddress.toLowerCase() !== deploymentObject.address) {
                        console.warn(`"${deploymentObject.contractName}" was not deployed at the predicted address ${deploymentObject.address})`);
                    }
                }
                contractAddresses[deploymentObject.contractName] = receipt.contractAddress.toLowerCase();
            });
    });

    return contractAddresses;
};

module.exports = {
    deployContracts,
};
