module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    }
  },
  // coverage: {
  //     host: "localhost",
  //     network_id: "*",
  //     port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
  //     //gas: 800000000000000, // <-- Use this high gas value //8000000000000? maybe this helps?
  //     //gasPrice: 0x01      // <-- Use this low gas price
  //   },  
  solc: {
    optimizer: {
      enabled: true,
      // set to same number of runs as openst-platform
      // so that integration tests on openst-protocol
      // give accurate gas measurements
      runs: 200
    }
  }
};
