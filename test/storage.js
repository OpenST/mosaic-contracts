// Copyright 2017 OpenST Ltd.
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
// Test: Storage.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const StorageUtils = require('./storage_utils.js');

///
/// Test stories
/// getStorage on index 0 position for a uint variable
/// getStorage on index 0 from mapping for msg.sender key
/// Properties
///

contract('Storage', function(accounts) {

  var storageContract = null
    , index = null
    , hexResult = null
    , decimalResult = null
  ;

  describe('Properties', async () => {
    before(async () => {
    var contracts = await StorageUtils.deployStorage(artifacts, accounts);
    storageContract = contracts.storage;
  })

  it('getStorage on index 0 position for a uint variable', async () => {
    index = '0000000000000000000000000000000000000000000000000000000000000000';
    hexResult = await web3.eth.getStorageAt(storageContract.address, index);
    decimalResult = web3.toDecimal(hexResult);
    console.log('HEX RESULT: ', hexResult,  'DECIMAL RESULT', decimalResult);
  })

  it('getStorage from mapping for msg.sender key', async () => {
    index = '0000000000000000000000000000000000000000000000000000000000000001';
    var key = "0000000000000000000000"+accounts[0];
    var newKey =  web3.sha3(key + index, {"encoding":"hex"});
    hexResult = await web3.eth.getStorageAt(storageContract.address, newKey);
    decimalResult = web3.toDecimal(hexResult);
    console.log('HEX RESULT: ', hexResult,  'DECIMAL RESULT', decimalResult);
  })

 })
})
