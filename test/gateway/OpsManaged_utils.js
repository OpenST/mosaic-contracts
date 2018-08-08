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
// Test: OpsManaged_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

module.exports.checkAdminAddressChangedEventGroup = (result, _newAddress) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "AdminAddressChanged")
   assert.equal(event.args._newAddress, _newAddress)
}

module.exports.checkOpsAddressChangedEventGroup = (result, _newAddress) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "OpsAddressChanged")
   assert.equal(event.args._newAddress, _newAddress)
}