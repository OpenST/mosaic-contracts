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
//
// ----------------------------------------------------------------------------
// Test: base.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const DeclareMessageBusKlass = require('./declareMessage');
const ProgressOutboxMessageBusKlass = require('./progressOutbox');
const ProgressInboxMessageBusKlass = require('./progressInbox');
const declareMessage = new DeclareMessageBusKlass();
const progressOutbox = new ProgressOutboxMessageBusKlass();
const progressInbox = new ProgressInboxMessageBusKlass();

contract('MessageBus',  function(accounts) {
	// describe('declareMessage', async function () {
	// 	await declareMessage.perform(accounts)
	// });
	
	// describe('ProgressOutbox', async function () {
	// 	await progressOutbox.perform(accounts)
	// });
	//
	describe('ProgressInbox', async function () {
		await progressInbox.perform(accounts)
	});
	
	/*
	after(function(){

	});
	*/
});