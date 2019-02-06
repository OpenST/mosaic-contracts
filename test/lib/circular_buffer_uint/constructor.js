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

const BN = require('bn.js');
const Utils = require('../../test_lib/utils.js');

const CircularBufferUint = artifacts.require('CircularBufferUint');

contract('CircularBufferUint.constructor()', async (accounts) => {
  it('deploys given accepted arguments', async () => {
    await CircularBufferUint.new(new BN(100));
  });

  it('reverts if the given buffer length is 0', async () => {
    await Utils.expectRevert(
      CircularBufferUint.new(new BN(0)),
      'The max number of items to store in a circular buffer must be greater than 0.',
    );
  });
});
