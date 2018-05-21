const Web3 = require('web3')
  , web3 = new Web3()
  , openSTValueContractAddress = '0xC0487285F176f520f5CD46720B686b6E46aEcd07'
  , web3Provider = new Web3("http://127.0.0.1:8545")
;

const generateStorage = {

  perform: async function() {
    // Works for variables only
    for (var index = 0; index < 200; index++) {
      console.log("\nIndex"+`[${index}]`);
      var storage = await web3Provider.eth.getStorageAt(openSTValueContractAddress, index);
      console.log("STORAGE", storage);
      console.log('DECIMAL:', + web3Provider.utils.toDecimal(storage));
    }
  }

};

generateStorage.perform();