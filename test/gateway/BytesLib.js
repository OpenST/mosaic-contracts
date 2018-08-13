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
// Test: BytesLib.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('../lib/utils.js');
const BytesLibTest = artifacts.require("./BytesLibTest.sol");

///
/// Test stories
/// 
/// Slice
///     fails to slice if input not bytes
///     successfully slices bytes
/// toUint
///     fails to convert to uint if input is not bytes
///     successfully convert to uint from bytes
/// toAddress
///     fails to covert to address if input is not bytes
///     successfully converts to address from bytes

contract('BytesLib', function(accounts) {

    before(async () => {
        bytesLib = await BytesLibTest.new();
    });

    describe ('Slice', async () => {

        it('fails to slice if input not bytes', async () => {
            var data = true; //bool data
            await Utils.expectThrow(bytesLib.slice(data, 0, 2));
        });

        it('successfully slices bytes', async () => {
            let data = 'test';
            //console.log(bytesLib);
            result = await bytesLib.slice(data, 0, 3);
            assert.equal(result, 0x746573); //0x746573 is hex for tes
        });

    });

    describe ('toUint', async () => { //requires input bytes length >32

        it('fails to convert to uint if input is not bytes', async () => {
            let data = true; 
            await Utils.expectThrow(bytesLib.toUint(data, 0));
        });

        it('successfully converts to uint from bytes', async () => {
            let data = "9102f050fe938943a0000000000000000000" //stands for 2.5868740518003989550431489852632293630102848184482716739285772305574766063664e+76;  
            result = await bytesLib.toUint(data, 0);
            number = await result.toString();
            assert.equal(number, 2.5868740518003989550431489852632293630102848184482716739285772305574766063664e+76)
        });

    });

    describe ('toAddress', async () => {

        it('fails to covert to address if input is not bytes', async () => {
            let data = true;   
            await Utils.expectThrow(bytesLib.toAddress(data, 0));
        });

        it('successfully converts to address from bytes', async () => {
            let data = "0x97fca9f4cc0d439163235c2c33abe8e4ba202580"    
            result = await bytesLib.toAddress(data, 0);
            assert.equal(result, data);
        });

    });
})
