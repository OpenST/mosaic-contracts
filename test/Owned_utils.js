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
// Test: Owned_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

module.exports.checkOwnershipTransferInitiatedEventGroup = (result, _proposedOwner) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "OwnershipTransferInitiated")
   assert.equal(event.args._proposedOwner, _proposedOwner)
}

module.exports.checkOwnershipTransferCompletedEventGroup = (result) => {
   assert.equal(result.logs.length, 1)

   const event = result.logs[0]

   assert.equal(event.event, "OwnershipTransferCompleted")
}