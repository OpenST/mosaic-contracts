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

const deployContracts = async (web3, deploymentObjects) => {
    const asyncForEach = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    };

    const contractAddresses = {};
    await asyncForEach(deploymentObjects, (deploymenObject) => {
        return web3.eth.sendTransaction(Object.assign(deploymenObject.transactionObject, {
          gasPrice: 1, gas: 8000000,
        }))
            .then((receipt) => {
                console.log(colors.dim(`Deploying ${deploymenObject.contractName} (tx ${receipt.transactionHash})`));
                return getTransactionReceiptMined(web3, receipt.transactionHash, 10);
            })
            .then((receipt) => {
                console.log(colors.green(`Deployed ${colors.underline.green(deploymenObject.contractName)} at ${receipt.contractAddress}`));
                if (receipt.contractAddress.toLowerCase() !== deploymenObject.address) {
                  console.warn(`"${deploymenObject.contractName}" was not deployed at the predicted address ${deploymenObject.address})`);
                }
                contractAddresses[deploymenObject.contractName] = receipt.contractAddress.toLowerCase();
            });
    });

    return contractAddresses;
};

module.exports = {
    deployContracts,
};
