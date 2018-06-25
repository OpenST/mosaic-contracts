module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    }
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
