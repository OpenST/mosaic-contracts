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

const GatewayLib = artifacts.require('GatewayLib');

contract('GatewayLib.bytes32ToBytes()', async (accounts) => {
  it('should return correct values', async () => {
    const gatewayLib = await GatewayLib.deployed();
    const bytes32Value = web3.utils.sha3('some data');

    const result = await gatewayLib.bytes32ToBytes(bytes32Value);

    assert.strictEqual(
      bytes32Value,
      result,
      'Expected value should be equal to actual.',
    );
  });
});
