const Web3 = require('web3');
const rlp = require('rlp');

/**
 * A simple AddressGenerator that returns auto-incremented addresses starting
 * from a provided address.
 * Suitable for genesis deployment.
 */
class IncrementingAddressGenerator {
    /**
     * @param {string} [startAddress=0x0000000000000000000000000000000000010000]
     *                  Address from which we generate (by incrementing)
     *                  new addresses for contracts to deploy.
     */
    constructor(startAddress = '0x0000000000000000000000000000000000010000') {
        this.nextAvailableAddress = startAddress;
    }

    /**
     * Function returns next available address.
     *
     * @return {string} Next address to use as a pre-allocated address within
     *         genesis file for contract deployment.
     */
    generateAddress() {
        const addressHex = this.nextAvailableAddress;

        // Incrementing next available address.
        const nextAddressBN = Web3.utils.toBN(addressHex).add(Web3.utils.toBN('1'));
        this.nextAvailableAddress = `0x${Web3.utils.padLeft(nextAddressBN, 40)}`;

        return addressHex;
    }
}

/**
 * An AddressGenerator that returns addresses based on the provided `from` address and
 * that address's current transaction nonce (which is auto-incremented).
 *
 * Suitable for deployment on a running network.
 */
class IncrementingNonceAddressGenerator {
    /**
     * @param {string} fromAddress The address that is used for deployment.
     * @param {number} startingNonce The first nonce to use for generating addresses.
     *                 This should be equivalent to the number of transactions previously
     *                 made from the `fromAddress`.
     */
    constructor(fromAddress, startingNonce) {
        if (typeof fromAddress === 'undefined') {
            throw new Error('"fromAddress" address not provided');
        }
        if (typeof startingNonce === 'undefined') {
            throw new Error('"startingNonce" not provided');
        }

        this.fromAddress = fromAddress;
        this.nextNonce = startingNonce;
    }

    /**
     * Returns the next available address.
     *
     * @return {string} Next address that will be used for a contract created by
     *                  a transaction from `fromAddress` at the current transaction
     *                  count (= nonce).
     */
    generateAddress() {
        // Derive address from sender and nonce.
        //
        // As per the Ethereum Yellowpaper it is defined as:
        // "The address of the new account is defined as being the rightmost
        // 160 bits of the Keccak hash of the RLP encoding of the structure
        // containing only the sender and the nonce."
        // See {@link http://gavwood.com/Paper.pdf}.
        const addressBytes = Web3.utils.sha3(rlp.encode([this.fromAddress, this.nextNonce]))
            // slice and substring give us the rightmost 160bits
            .slice(12)
            .substring(14);
        const address = `0x${addressBytes}`;
        this.nextNonce += 1;

        return address;
    }
}

module.exports = {
    IncrementingAddressGenerator,
    IncrementingNonceAddressGenerator,
};
