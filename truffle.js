module.exports = {
  networks: {
    development: {
      host: "localhost",
      network_id: "*", // Match any network id
      port: 8545,
      gas: 12000000,
      gasPrice: 0x01      
    }
  },
  coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value 
      gasPrice: 0x01      // <-- Use this low gas price
    },  
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
