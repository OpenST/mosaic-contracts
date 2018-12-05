// Copyright 2018 OpenST Ltd.
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

const Organization = artifacts.require('Organization');

contract('Organization.constructor()', async (accounts) => {

  let owner = accounts[0];

  it('checks that organization owner is set to creator', async () => {
    organization = await Organization.new({ from: owner });
    let setOwner = await organization.owner.call();
    assert.strictEqual(
      setOwner,
      owner,
      'The initial owner of an organization must be its creator.'
    );
  });
});
