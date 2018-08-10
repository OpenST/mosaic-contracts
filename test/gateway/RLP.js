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
// Test: RLP.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const RLPTest = artifacts.require("./RLPTest.sol"),
	rlp = require("rlp"),
	Utils = require('../lib/utils.js');


contract('RLP', function (accounts) {
	let rlpTest;
	before(async () => {
		rlpTest = await RLPTest.new();
	});

	describe('ToRLPItem', async () => {

		it('should pass when input is RLP encoded list', async () => {
			let dataArray = ['2', '5', '6', '86735']
				, hexDataArray = rlp.encode(dataArray).toString('hex')
				, result = await rlpTest.toRLPItem.call('0x' + hexDataArray);
			//result[0] is memory pointer and result[1] is length
			// memory pointer should be greater than 0
			assert.equal((result[0].toString(10) > 0), true);
			
			// length should be greater than 0
			assert.equal((result[1].toString(10) > 0), true);
		});

		it('should pass when input is RLP encoded list and strict', async () => {
			let dataArray = ['2', '5', '6', '86735']
				, hexDataArray = rlp.encode(dataArray).toString('hex')
				, result = await rlpTest.toRLPItemStrict.call('0x' + hexDataArray, true);
			//result[0] is memory pointer and result[1] is length
			// memory pointer should be greater than 0
			assert.equal((result[0].toString(10) > 0), true);
			
			// length should be greater than 0
			assert.equal((result[1].toString(10) > 0), true);
		});	

		it('should pass when input is RLP encoding of number', async () => {
			let data = 1234
				, hexData = rlp.encode(data).toString('hex')
				, result = await rlpTest.toRLPItem.call('0x' + hexData);
			//result[0] is memory pointer and result[1] is length
			// memory pointer should be greater than 0
			assert.equal((result[0].toString(10) > 0), true);
			
			// length should be greater than 0
			assert.equal((result[1].toString(10) > 0), true);
		});
		
		it('should pass when input is blank or 0x (NOT RLP encoded)', async () => {
			let result = await rlpTest.toRLPItem.call("");
			//result[0] is memory pointer and result[1] is length
			// memory pointer should be 0
			assert.equal(result[0].toString(10), 0);
			
			// length should be 0
			assert.equal((result[1].toString(10)), 0);
		});
		
	});

	describe('Next', async () => {

		it('should be able to get the next RLP subitem', async () => {
			let rlpItemOne = rlp.encode('5')
				, rlpItemTwo = rlp.encode('6')
				, items = [rlpItemOne, rlpItemTwo]
				, rlpEncodedArray = rlp.encode(items).toString('hex');
			
				let result = await rlpTest.nextStrict.call('0x' + rlpEncodedArray, true)
				assert.equal((result[0].toString(10) > 0), true);
				assert.equal((result[1].toString(10) > 0), true);			
		});

	});	

	describe('ToList', async () => {
		
		it('should pass when list is RLP encoded of length one', async () => {
			let rlpItem = rlp.encode('5')
				, items = [rlpItem]
				, rlpEncodedArray = rlp.encode(items).toString('hex')
				, index = 0;
			let result = await rlpTest.toList.call('0x' + rlpEncodedArray, index)
				, itemAtIndex = result[0];
			assert.equal('0x' + rlpItem.toString('hex'), itemAtIndex);
			
		});

		it('should pass when list is RLP encoded', async () => {
			let rlpItemOne = rlp.encode('5')
				, rlpItemTwo = rlp.encode('6')
				, items = [rlpItemOne, rlpItemTwo]
				, rlpEncodedArray = rlp.encode(items).toString('hex');
			
			for (let index = 0; index < items.length; index++) {
				let result = await rlpTest.toList.call('0x' + rlpEncodedArray, index)
					, itemAtIndex = result[0];
				assert.equal('0x' + items[index].toString('hex'), itemAtIndex);
			}
		});
		
		it('should pass when input RLP encoding of empty list', async () => {
			let dataArray = []
				, hexDataArray = rlp.encode(dataArray).toString('hex')
				, result = await rlpTest.toList.call('0x' + hexDataArray, 0)
				length = result[1].toNumber();
			assert.equal(dataArray.length, length);
		});
		
		it('should fail when input is non-list', async () => {
			let data = 1234
				, hexDataArray = rlp.encode(data).toString('hex');
			await Utils.expectThrow(rlpTest.toList.call('0x' + hexDataArray, 0));
		});
		
		it('should fail when input is empty', async () => {
			let data = "";
			await Utils.expectThrow(rlpTest.toList.call('0x' + data, 0));
		});
		
		it('should fail when input is not RLP encoded ', async () => {
			let data = '1234';
			await Utils.expectThrow(rlpTest.toList.call('0x' + data, 0));
		});
		
	});
	
	describe('ToBytes', async () => {
		
		it('should pass when input is list', async () => {
			let dataArray = ['2', '5', '6', '86735']
				, hexDataArray = rlp.encode(dataArray).toString('hex')
				, result = await rlpTest.toBytes.call('0x' + hexDataArray);
			assert.equal(result.replace("0x", ""), hexDataArray);
		});
		
		it('should pass when input is non-list', async () => {
			let data = 1234
				, hexData = rlp.encode(data).toString('hex')
				, result = await rlpTest.toBytes.call('0x' + hexData);
			assert.equal(result.replace("0x", ""), hexData);
		});
		
		it('should pass when input is empty', async () => {
			let data = ""
				, result = await rlpTest.toBytes.call('0x' + data);
			assert.equal("0x", result);
		});

	});
	
	describe('ToData', async () => {
		
		it('should pass when input is non-list', async () => {
			let data = "1234"
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toData.call('0x' + hexDataArray);
			assert.equal(result.replace("0x", ""), Buffer.from(data).toString('hex'));
		});
		
		it('should fail when input is in list form and encoded', async () => {
			let data = ['2', '5', '6', '86735']
				, hexDataArray = rlp.encode(data).toString('hex');
			await Utils.expectThrow(rlpTest.toData.call('0x' + hexDataArray));
		});

		it('should fail when input array data is empty', async () => {
			let hexDataArray = "";
			await Utils.expectThrow(rlpTest.toData.call('0x' + hexDataArray));
		});

		it('should fail when input is in list form', async () => {
			let dataArray = ['2', '5', '6'];
			await Utils.expectThrow(rlpTest.toData.call('0x' + dataArray));
		});

	});	

	describe('IsNull', async () => {

		it('should return false when input is not null', async () => {
			let data = "1"
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.isNull.call('0x' + hexDataArray);
			assert.equal(result, false);
		});

		it ('should return true when input is null', async () => {
			let hexDataArray = ""
				, result = await rlpTest.isNull.call('0x' + hexDataArray);
			assert.equal(result, true);
		});

	});

	describe('IsEmpty', async () => {

		it('should return false when input is not empty', async () => {
			let data = "1"
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.isEmpty.call('0x' + hexDataArray);
			assert.equal(result, false);
		});

		it ('should return true when input is empty', async () => {
			let data = ""
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.isEmpty.call('0x' + hexDataArray);
			assert.equal(result, true);
		});
	});

	describe('ToAscii', async () => {

		it('should convert input to Ascii', async () => {
			let data = "Test"
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toAscii.call('0x' + hexDataArray);
			assert.equal(result, data);
		});

	});

	describe('ToBool', async () => {

		it('should convert input to Bool', async () => {
			let data = 1// stands for true
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toBool.call('0x' + hexDataArray);
			assert.equal(result, data);
		});

	});

	describe('ToByte', async () => {

		it('should convert input to Byte', async () => {
			var data = 1 //stand for 0x01
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toByte.call('0x' + hexDataArray);	
			assert.equal(result, data);
		});

	});

	describe('ToInt', async () => {

		it('should convert input to Int', async () => {
			let data = 1 
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toInt.call('0x' + hexDataArray);
			assert.equal(result, data);
		});

	});

	describe('ToAddress', async () => {

		it('should convert input to Address', async () => {
			let data = "0x97fca9f4cc0d439163235c2c33abe8e4ba202580"
				, hexDataArray = rlp.encode(data).toString('hex')
				, result = await rlpTest.toAddress.call('0x' + hexDataArray);	
			assert.equal(result, data);
		});

	});	
})


