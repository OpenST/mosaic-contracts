/* eslint-disable @typescript-eslint/no-var-requires */
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

import Util from './Util';
import NodeBase from './NodeBase';
import BranchNode from './BranchNode';
import ExtensionNode from './ExtensionNode';
import LeafNode from './LeafNode';

import assert = require('assert');
import ethUtil = require('ethereumjs-util');
import rlp = require('rlp');

interface ProofData {
  value: Buffer;
  encodedPath: Buffer;
  rlpParentNodes: Buffer;
  root: Buffer;
}

const FuzzyProofGenerator = {

  generate(pattern: string, path: string, value: string): ProofData {
    this.assertPatternValidity(pattern);

    const endingWithBranchNode: boolean = (pattern[pattern.length - 1] === 'b');

    const nibblePath: Buffer = Util.toNibbles(Buffer.from(path));
    Util.assertNibbleArray(nibblePath);
    assert(nibblePath.length >= pattern.length - (endingWithBranchNode ? 1 : 0));

    const valueHash: Buffer = ethUtil.keccak256(value);

    const pathData: Buffer[] = this.generateRandomPathData(
      (endingWithBranchNode ? pattern.substring(0, pattern.length - 1) : pattern),
      nibblePath,
    );

    if (endingWithBranchNode) {
      pathData.push(Buffer.from([]));
    }

    const branchesKeysData: Buffer[][] = this.generateRandomBranchesKeysData(
      pattern.split('b').length - 1,
    );

    const nodes: NodeBase[] = this.createNodes(
      pattern,
      Buffer.from(value),
      pathData,
      branchesKeysData,
    );
    assert(nodes.length === pattern.length);

    const rlpParentNodesArray: Buffer[][] = [];
    nodes.forEach((n): void => {
      rlpParentNodesArray.push(n.raw());
    });

    const proofData = {
      value: valueHash,
      encodedPath: Buffer.from(path),
      rlpParentNodes: rlp.encode(rlpParentNodesArray),
      root: nodes[0].hash(),
    };

    return proofData;
  },

  assertPatternValidity(pattern: string): void {
    if (pattern.length === 0) {
      throw new Error('The pattern is empty.');
    }

    switch (pattern[0]) {
      case 'b': {
        this.processBranch(pattern, 1);
        break;
      }
      case 'e': {
        this.processExtension(pattern, 1);
        break;
      }
      case 'l': {
        this.processLeaf(pattern, 1);
        break;
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
      }
    }
  },

  processLeaf(pattern: string, index: number): void {
    assert(index > 0);
    if (index !== pattern.length) {
      throw new Error('Pattern does not end with leaf node.');
    }
  },

  processBranch(pattern: string, index: number): void {
    assert(index > 0);

    if (index === pattern.length) {
      if (pattern.length === 1 || pattern[index - 2] !== 'b') {
        throw new Error('Pattern can end with double branch node only.');
      }
      return;
    }

    switch (pattern[index]) {
      case 'b': {
        this.processBranch(pattern, index + 1);
        break;
      }
      case 'e': {
        this.processExtension(pattern, index + 1);
        break;
      }
      case 'l': {
        this.processLeaf(pattern, index + 1);
        break;
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[index]}) in the pattern.`);
      }
    }
  },

  processExtension(pattern: string, index: number): void {
    assert(index > 0);

    if (pattern.length === 0) {
      throw new Error('Pattern ends with an extension node.');
    }

    switch (pattern[index]) {
      case 'b': {
        this.processBranch(pattern, index + 1);
        break;
      }
      case 'e': {
        throw new Error('Pattern contains two consecutive extension nodes.');
      }
      case 'l': {
        throw new Error('Pattern contains a leaf node after an extension node.');
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[index]}) in the pattern.`);
      }
    }
  },

  generateRandomPathData(
    pattern: string,
    nibblePath: Buffer,
  ): Buffer[] {
    assert(pattern.length > 0);
    assert(nibblePath.length >= pattern.length);

    const numberCount: number = pattern.length
      - (pattern.split('b').length - 1);

    const sum: number = nibblePath.length - pattern.length;

    const randomNumbers: number[] = this.generateRandomNumbers(sum, numberCount);

    const pathData = this.generatePathData(
      pattern,
      nibblePath,
      randomNumbers,
    );

    return pathData;
  },

  generatePathData(
    pattern: string,
    nibblePath: Buffer,
    randomNumbers: number[],
  ): Buffer[] {
    assert(pattern.length !== 0);
    assert(nibblePath.length >= pattern.length);

    const pathData: Buffer[] = [];

    let randomNumbersIndex = 0;
    let nibblePathIndex = 0;

    for (let i = 0; i < pattern.length; i += 1) {
      assert(nibblePathIndex < nibblePath.length);
      switch (pattern[i]) {
        case 'b': {
          pathData.push(nibblePath.slice(nibblePathIndex, nibblePathIndex + 1));
          nibblePathIndex += 1;
          break;
        }
        case 'e':
        case 'l': {
          assert(randomNumbersIndex < randomNumbers.length);
          pathData.push(
            nibblePath.slice(
              nibblePathIndex,
              nibblePathIndex + randomNumbers[randomNumbersIndex] + 1,
            ),
          );
          nibblePathIndex += (randomNumbers[randomNumbersIndex] + 1);
          randomNumbersIndex += 1;
          break;
        }
        default: {
          throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
        }
      }
    }

    assert(nibblePathIndex === nibblePath.length);
    assert(randomNumbersIndex === randomNumbers.length);

    assert.deepEqual(
      pathData.reduce((acc: Buffer, val: Buffer): Buffer => Buffer.concat([acc, val])),
      nibblePath,
    );

    return pathData;
  },

  // https://en.wikipedia.org/wiki/Stars_and_bars_%28combinatorics%29
  // https://math.stackexchange.com/questions/1276206/method-of-generating-random-numbers-that-sum-to-100-is-this-truly-random
  generateRandomNumbers(sum: number, numberCount: number): number[] {
    assert(sum >= 0);
    assert(numberCount >= 0);

    if (numberCount === 0) {
      return [];
    }

    if (numberCount === 1) {
      return [sum];
    }

    const lowerBoundInclusive = 1;
    const upperBoundInclusive = sum + numberCount - 1;

    const pickedRandoms: number[] = [];

    for (let i = 0; i < numberCount - 1; i += 1) {
      let x: number = -1;
      do {
        x = lowerBoundInclusive + Math.floor(Math.random() * upperBoundInclusive);
      } while (pickedRandoms.includes(x));

      pickedRandoms.push(x);
    }

    assert(pickedRandoms.length === numberCount - 1);

    pickedRandoms.forEach(
      (el: number): void => assert(el >= lowerBoundInclusive && el <= upperBoundInclusive),
    );

    pickedRandoms.sort((a: number, b: number): number => a - b);

    const generatedRandoms: number[] = [];
    generatedRandoms.push(pickedRandoms[0] - 1);
    for (let i = 1; i < numberCount - 1; i += 1) {
      generatedRandoms.push(pickedRandoms[i] - pickedRandoms[i - 1] - 1);
    }
    generatedRandoms.push(upperBoundInclusive - pickedRandoms[pickedRandoms.length - 1]);

    generatedRandoms.forEach(
      (el: number): void => assert(el >= 0),
    );
    assert(generatedRandoms.length === numberCount);
    assert(generatedRandoms.reduce((a, b): number => a + b) === sum);

    return generatedRandoms;
  },

  generateRandomBranchesKeysData(branchAmount: number): Buffer[][] {
    assert(branchAmount >= 0);

    const branchesKeysData: Buffer[][] = [];
    for (let i = 0; i < branchAmount; i += 1) {
      branchesKeysData.push(this.generateRandomBranchKeysData());
    }

    return branchesKeysData;
  },

  generateRandomBranchKeysData(): Buffer[] {
    const branchKeysData: Buffer[] = new Array<Buffer>(16);
    branchKeysData.fill(Buffer.from([]));

    const rAmount: number = Math.floor(Math.random() * 16);
    assert(rAmount >= 0 && rAmount < 16);

    const rIndexes: number[] = [];

    for (let i = 0; i < rAmount; i += 1) {
      let x: number = -1;
      do {
        x = Math.floor(Math.random() * 16);
        assert(x >= 0 && x < 16);
      } while (rIndexes.includes(x));

      rIndexes.push(x);
    }

    assert(rIndexes.length === rAmount);

    for (let i = 0; i < rIndexes.length; i += 1) {
      assert(rIndexes[i] >= 0 && rIndexes[i] < 16);
      branchKeysData[rIndexes[i]] = Util.generateRandomKeccak256();
    }

    return branchKeysData;
  },

  createNodes(
    pattern: string,
    value: Buffer,
    nibblePathData: Buffer[],
    branchKeysData: Buffer[][],
  ): NodeBase[] {
    assert(pattern.length !== 0);
    assert(value.length !== 0);
    assert(nibblePathData.length !== 0);
    assert(pattern.length === nibblePathData.length);
    this.assertPatternValidity(pattern);

    const nodes: NodeBase[] = [];
    let previousNodeHash: Buffer = Buffer.from([]);
    let branchKeysDataIndex = 0;

    for (let i: number = pattern.length - 1; i >= 0; i -= 1) {
      switch (pattern[i]) {
        case 'l': {
          assert(i === pattern.length - 1);
          assert(previousNodeHash.length === 0);
          assert(nibblePathData[i].length >= 1);

          const ln = new LeafNode(nibblePathData[i], value);
          previousNodeHash = ln.hash();
          nodes.push(ln);

          break;
        }
        case 'e': {
          assert(previousNodeHash.length !== 0);
          assert(nibblePathData[i].length >= 1);

          const en = new ExtensionNode(nibblePathData[i], previousNodeHash);
          previousNodeHash = en.hash();
          nodes.push(en);

          break;
        }
        case 'b': {
          assert(branchKeysDataIndex < branchKeysData.length);

          if (i === pattern.length - 1) {
            assert(nibblePathData[i].length === 0);

            const bn = new BranchNode(branchKeysData[branchKeysDataIndex], value);

            branchKeysDataIndex += 1;

            previousNodeHash = bn.hash();
            nodes.push(bn);
          } else {
            assert(nibblePathData[i].length === 1);
            assert(nibblePathData[i][0] >= 0 && nibblePathData[i][0] <= 15);

            const bks: Buffer[] = branchKeysData[branchKeysDataIndex];
            bks[nibblePathData[i][0]] = previousNodeHash;
            const bn = new BranchNode(bks, Buffer.alloc(0));

            branchKeysDataIndex += 1;

            previousNodeHash = bn.hash();
            nodes.push(bn);
          }

          break;
        }
        default: {
          throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
        }
      }
    }

    assert(branchKeysDataIndex === branchKeysData.length);

    nodes.reverse();

    return nodes;
  },
};

export { FuzzyProofGenerator as default };
