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
// Utility chain: OpenSTUtility
//
// http://www.simpletoken.org/
//
// Based on the SafeMath library by the OpenZeppelin team.
// Copyright (c) 2016 Smart Contract Solutions, Inc.
// https://github.com/OpenZeppelin/zeppelin-solidity
// The MIT License.
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const Utils = require('../test_lib/utils.js');

const TestSafeMath = artifacts.require('TestSafeMath');

contract('SafeMath', () => {
  let safeMath;

  before(async () => {
    safeMath = await TestSafeMath.new();
  });

  it('multiplies correctly', async () => {
    const a = 5678;
    const b = 1234;
    await safeMath.multiply(a, b);
    const result = await safeMath.result();
    assert.equal(result, a * b);
  });

  it('adds correctly', async () => {
    const a = 5678;
    const b = 1234;
    await safeMath.add(a, b);
    const result = await safeMath.result();

    assert.equal(result, a + b);
  });

  it('subtracts correctly', async () => {
    const a = 5678;
    const b = 1234;
    await safeMath.subtract(a, b);
    const result = await safeMath.result();

    assert.equal(result, a - b);
  });

  it('should throw an error if subtraction result would be negative', async () => {
    const a = 1234;
    const b = 5678;
    await Utils.expectThrow(safeMath.subtract(a, b));
  });

  it('should throw an error on addition overflow', async () => {
    const a = new BN(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    );
    const b = new BN(1);
    await Utils.expectThrow(safeMath.add(a, b));
  });

  it('should throw an error on multiplication overflow', async () => {
    const a = new BN(
      '115792089237316195423570985008687907853269984665640564039457584007913129639933',
    );
    const b = new BN(2);
    await Utils.expectThrow(safeMath.multiply(a, b));
  });
});
