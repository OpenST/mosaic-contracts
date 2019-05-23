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

import Nibbles from './Nibbles';
import NodeBase from './NodeBase';
import { BranchNode } from './BranchNode';
import { BranchKeys } from './BranchNode';
import ExtensionNode from './ExtensionNode';
import LeafNode from './LeafNode';
import ProofData from './ProofData';

import assert = require('assert');
import ethUtil = require('ethereumjs-util');
import rlp = require('rlp');
import crypto = require('crypto');


const FuzzyProofGenerator = {

  /** Generates a proof data. */
  generateByPattern(
    pattern: string,
    pathMaxLength: number = 32,
    valueMaxLength: number = 32,
  ): ProofData {
    assert(pathMaxLength >= 1);
    assert(valueMaxLength >= 1);

    this.assertPatternValidity(pattern);

    const pathMinLength: number = Math.ceil(pattern.length / 2);
    assert(pathMaxLength >= pathMinLength);

    const pathLength: number = pathMinLength + Math.floor(
      Math.random() * (pathMaxLength - pathMinLength + 1),
    );
    assert(pathLength <= pathMaxLength);
    assert(pathLength >= pathMinLength);

    const path: Buffer = crypto.randomBytes(pathLength);

    const valueLength = 1 + Math.floor(Math.random() * valueMaxLength);
    assert(valueLength <= valueMaxLength);
    assert(valueLength >= 1);
    const value: Buffer = crypto.randomBytes(valueLength);

    return this.generate(pattern, path, value);
  },

  /** Generates a proof data. */
  generate(pattern: string, path: Buffer, value: Buffer): ProofData {
    this.assertPatternValidity(pattern);

    const endingWithBranchNode: boolean = (pattern[pattern.length - 1] === 'b');

    const nibblePath: Buffer = Nibbles.toNibbles(path);
    Nibbles.assertNibbleArray(nibblePath);

    // If a pattern ends with a branch node, that branch node is not going
    // to contain any nibble from the pattern and only value.
    assert(nibblePath.length >= pattern.length - (endingWithBranchNode ? 1 : 0));

    const rlpValue: Buffer = rlp.encode(value);
    const valueHash: Buffer = ethUtil.keccak256(value);
    const rlpValuehash: Buffer = ethUtil.keccak256(rlpValue);

    const pathData: Buffer[] = this.generateRandomPathData(
      (endingWithBranchNode ? pattern.substring(0, pattern.length - 1) : pattern),
      nibblePath,
    );

    // If a pattern ends with a branch node, that branch node is not going
    // to contain any nibble from the pattern and only value. That's why
    // during generation of path sections according to the pattern ending
    // branch node is not counted and we add an empty Buffer representing
    // ending branch node path section.
    if (endingWithBranchNode) {
      pathData.push(Buffer.from([]));
    }

    const branchesKeysData: BranchKeys[] = this.generateRandomBranchesKeysData(
      pattern.split('b').length - 1,
    );

    const nodes: NodeBase[] = this.createNodes(
      pattern,
      value,
      pathData,
      branchesKeysData,
    );
    assert(nodes.length === pattern.length);

    const rlpParentNodesArray: Buffer[][] = [];
    nodes.forEach((n): void => {
      rlpParentNodesArray.push(n.raw());
    });

    const proofData = {
      value: (endingWithBranchNode ? rlpValuehash : valueHash),
      encodedPath: path,
      rlpParentNodes: rlp.encode(rlpParentNodesArray),
      root: nodes[0].hash(),
    };

    return proofData;
  },

  /** Asserts a pattern validity by traversing through state machine. */
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
    if (index !== pattern.length) {
      throw new Error('Pattern does not end with leaf node.');
    }
  },

  processBranch(pattern: string, index: number): void {
    if (index === pattern.length) {
      if (pattern.length === 1 || pattern[index - 2] !== 'b') {

        // The verification library we are using in our project would accept
        // as a valid proof only a path ending with double 'b' (putting aside
        // an ending leaf node, as it's always allowed).

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
    if (pattern.length === index) {
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

  /**
   * Divides a path into a random consecutive sections according to the
   * specified pattern.
   */
  generateRandomPathData(
    pattern: string,
    nibblePath: Buffer,
  ): Buffer[] {
    assert(pattern.length > 0);
    assert(nibblePath.length >= pattern.length);

    // "numberCount" variable below is the count of extension and leaf nodes
    // in the pattern.
    const numberCount: number = pattern.length
      - (pattern.split('b').length - 1);

    // Each node in the pattern is going to use at least one nibble.
    // Hence, we are calculating nibbles' amount, left after subtracting
    // nibbles path's length from pattern's length.
    // Variable is named "sum", as in the next step, we will randomly choose
    // numbers ("numberCount" is the count of numbers) that sum up to "sum".
    const sum: number = nibblePath.length - pattern.length;

    // Generates non-negative numbers that sum up to "sum".
    const randomNumbers: number[] = this.generateRandomNumbers(sum, numberCount);

    // Numbers generated above, were non-negative numbers (includes 0)
    // that sum up to "sum", which was calculated by taking out pattern length.
    const pathSectionsLengths: number[] = randomNumbers.map(x => x + 1);

    const pathData = this.generatePathData(
      pattern,
      nibblePath,
      pathSectionsLengths,
    );

    return pathData;
  },

  /**
   * Divides a path into a consecutive sections according to the
   * specified pattern and lengths parameter.
   */
  generatePathData(
    pattern: string,
    nibblePath: Buffer,
    pathSectionsLengths: number[],
  ): Buffer[] {
    assert(pattern.length !== 0);
    assert(nibblePath.length >= pattern.length);

    const pathData: Buffer[] = [];

    let pathSectionsIndex = 0;
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
          assert(pathSectionsIndex < pathSectionsLengths.length);
          pathData.push(
            nibblePath.slice(
              nibblePathIndex,
              nibblePathIndex + pathSectionsLengths[pathSectionsIndex],
            ),
          );
          nibblePathIndex += (pathSectionsLengths[pathSectionsIndex]);
          pathSectionsIndex += 1;
          break;
        }
        default: {
          throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
        }
      }
    }

    assert(nibblePathIndex === nibblePath.length);
    assert(pathSectionsIndex === pathSectionsLengths.length);

    assert.deepEqual(
      pathData.reduce((acc: Buffer, val: Buffer): Buffer => Buffer.concat([acc, val])),
      nibblePath,
    );

    return pathData;
  },

  /**
   * Generates random non-negative numbers that sum to the specified value.
   *
   * @remarks:
   * See: https://math.stackexchange.com/questions/1276206/method-of-generating-random-numbers-that-sum-to-100-is-this-truly-random
   * See: https://en.wikipedia.org/wiki/Stars_and_bars_%28combinatorics%29
   */
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
      let x = -1;
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

  /**
   * Generates an array of branch nodes with random values for keys.
   *
   * @param branchNodeAmount An amount of branch nodes to generate data for.
   */
  generateRandomBranchesKeysData(branchNodeAmount: number): BranchKeys[] {
    assert(branchNodeAmount >= 0);

    const branchesKeysData: BranchKeys[] = [];
    for (let i = 0; i < branchNodeAmount; i += 1) {
      branchesKeysData.push(this.generateRandomBranchKeysData());
    }

    return branchesKeysData;
  },

  /**
   * Generates a branch node with random values for keys.
   * First, function generates random number between 0 and 16 (max amount of
   * keys for a branch node). Afterwards, generates a random index for each
   * key and random value to be stored in that index.
   */
  generateRandomBranchKeysData(): Buffer[] {
    const branchKeysData: Buffer[] = new Array<Buffer>(16);
    branchKeysData.fill(Buffer.from([]));

    const amount: number = Math.floor(Math.random() * 16);
    assert(amount >= 0 && amount < 16);

    const indexes: number[] = [];

    for (let i = 0; i < amount; i += 1) {
      let x = -1;
      do {
        x = Math.floor(Math.random() * 16);
        assert(x >= 0 && x < 16);
      } while (indexes.includes(x));

      indexes.push(x);
    }

    assert(indexes.length === amount);

    for (let i = 0; i < indexes.length; i += 1) {
      assert(indexes[i] >= 0 && indexes[i] < 16);
      branchKeysData[indexes[i]] = this.generateRandomKeccak256();
    }

    return branchKeysData;
  },

  /**
   * Creates nodes.
   *
   * Creates nodes bottom up by passing a previous node hash up by stack.
   *
   * @param pattern A pattern for a path.
   * @param value A value to store in an ending node (either leaf or branch node).
   * @param nibblePathData A buffer array containing the path segment for each node.
   * @param branchKeysData A buffer array containing the keys for each branch node.
   */
  createNodes(
    pattern: string,
    value: Buffer,
    nibblePathData: Buffer[],
    branchKeysData: BranchKeys[],
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

  /** Generates random keccak256 value. */
  generateRandomKeccak256(): Buffer {
    return ethUtil.keccak256(
      crypto.randomBytes(256),
    );
  },

};

export { FuzzyProofGenerator as default };
