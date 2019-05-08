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
import {
  NodeBase, BranchNode, ExtensionNode, LeafNode,
} from './Nodes';

import assert = require('assert');
import ethUtil = require('ethereumjs-util');
import rlp = require('rlp');

interface ProofData {
  root: string;
  value: string;
  proof: string;
  path: string;
}

const FuzzyProofGenerator = {

  generate(pattern: string, path: string, value: string): ProofData {
    const nibblePath: Buffer = Util.stringToNibbles(path);
    assert(Util.assertNibbleArray(nibblePath));
    assert(nibblePath.length >= pattern.length);

    assert(value.length !== 0);
    const valueHash: string = ethUtil.sha3(value);

    this.assertPatternValidity(pattern);

    const nibblePathFuzzyData: number[][] = this.generatePathFuzzyData(
      pattern, nibblePath,
    );
    assert(nibblePathFuzzyData.length === pattern.length);

    const nodes: NodeBase[] = this.createNodes(
      pattern, valueHash, nibblePathFuzzyData,
    );
    assert(nodes.length === pattern.length);

    const rlpEncodedNodes: string[] = [];
    nodes.forEach((n): void => {
      rlpEncodedNodes.push(n.serialize());
    });

    const proofData = {
      value: valueHash,
      path,
      proof: rlp.encode(rlpEncodedNodes),
      root: nodes[0].hash(),
    };

    return proofData;
  },

  assertPatternValidity(pattern): void {
    if (pattern.length === 0) {
      throw new Error('The pattern is empty.');
    }

    switch (pattern[0]) {
      case 'b': {
        this.processBranch(pattern.substring(1));
        break;
      }
      case 'e': {
        this.processExtension(pattern.substring(1));
        break;
      }
      case 'l': {
        this.processLeaf(pattern.substring(1));
        break;
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
      }
    }
  },

  processLeaf(pattern: string): void {
    if (pattern.length !== 0) {
      throw new Error('Pattern does not end with leaf node.');
    }
  },

  processBranch(pattern: string): void {
    if (pattern.length === 0) {
      return;
    }

    switch (pattern[0]) {
      case 'b': {
        this.processBranch(pattern.substring(1));
        break;
      }
      case 'e': {
        this.processExtension(pattern.substring(1));
        break;
      }
      case 'l': {
        this.processLeaf(pattern.substring(1));
        break;
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
      }
    }
  },

  processExtension(pattern: string): void {
    if (pattern.length === 0) {
      throw new Error('Pattern ends with an extension node.');
    }

    switch (pattern[0]) {
      case 'b': {
        this.processBranch(pattern.substring(1));
        break;
      }
      case 'e': {
        throw new Error('Pattern contains two consecutive extension nodes.');
      }
      case 'l': {
        throw new Error('Pattern contains a leaf node after an extension node.');
      }
      default: {
        throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
      }
    }
  },

  generatePathFuzzyData(
    pattern: string,
    nibblePath: number[],
  ): number[][] {
    assert(nibblePath.length >= pattern.length);


    const numberCount: number = pattern.length - (pattern.split('b').length - 1);
    const sum: number = nibblePath.length - pattern.length;

    const randomNumbers: number[] = this.generateRandomNumbers(sum, numberCount);
    const randomNumbersIndex = 0;

    const fuzzyData: number[][] = [];
    let nibblePathIndex = 0;

    for (let i = 0; i < pattern.length; i += 1) {
      switch (pattern[i]) {
        case 'b': {
          assert(nibblePathIndex < nibblePath.length);
          fuzzyData.push(nibblePath.slice(nibblePathIndex, nibblePathIndex + 1));
          nibblePathIndex += 1;
          break;
        }
        case 'e':
        case 'l': {
          fuzzyData.push(
            nibblePath.slice(
              nibblePathIndex,
              nibblePathIndex + randomNumbers[randomNumbersIndex] + 1,
            ),
          );
          break;
        }
        default: {
          throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
        }
      }
    }

    return fuzzyData;
  },

  // https://en.wikipedia.org/wiki/Stars_and_bars_%28combinatorics%29
  // https://math.stackexchange.com/questions/1276206/method-of-generating-random-numbers-that-sum-to-100-is-this-truly-random
  generateRandomNumbers(sum: number, numberCount: number): number[] {
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

    assert(pickedRandoms.length !== 0);

    pickedRandoms.sort();

    const generatedRandoms: number[] = [];
    generatedRandoms.push(pickedRandoms[0] - 1);
    for (let i = 1; i < numberCount - 1; i += 1) {
      generatedRandoms.push(pickedRandoms[i] - pickedRandoms[i - 1] - 1);
    }
    generatedRandoms.push(upperBoundInclusive - pickedRandoms[pickedRandoms.length - 1]);

    return generatedRandoms;
  },

  createNodes(
    pattern: string, valueHash: string, nibblePathFuzzyData: number[][],
  ): NodeBase[] {
    const nodes: NodeBase[] = [];
    let previousNodeHash = '';

    for (let i = pattern.length - 1; i >= 0; i -= 1) {
      switch (pattern[i]) {
        case 'b': {
          assert(nibblePathFuzzyData[i].length === 1);
          assert(nibblePathFuzzyData[i][0] >= 0 && nibblePathFuzzyData[i][0] <= 16);

          let bv = '';
          if (i === pattern.length - 1) {
            bv = valueHash;
          }

          const bks: string[] = new Array<string>(16);
          bks[nibblePathFuzzyData[i][0]] = previousNodeHash;
          const bn = new BranchNode(bks, bv);
          previousNodeHash = bn.hash();
          nodes.push(bn);
          break;
        }
        case 'e': {
          assert(nibblePathFuzzyData[i].length >= 1);
          const en = new ExtensionNode(nibblePathFuzzyData[i], previousNodeHash);
          previousNodeHash = en.hash();
          nodes.push(en);

          break;
        }
        case 'l': {
          assert(nibblePathFuzzyData[i].length >= 1);
          const ln = new LeafNode(nibblePathFuzzyData[i], valueHash);
          previousNodeHash = ln.hash();
          nodes.push(ln);

          break;
        }
        default: {
          throw new Error(`An unexpected symbol (${pattern[0]}) in the pattern.`);
        }
      }
    }
    nodes.reverse();

    return nodes;
  },
};

export { FuzzyProofGenerator as default };
