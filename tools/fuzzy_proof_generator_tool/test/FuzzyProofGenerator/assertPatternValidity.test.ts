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

import 'mocha';
import { assert } from 'chai';
import FuzzyProofGenerator from '../../src/FuzzyProofGenerator';

describe('FuzzyProofGenerator::assertPatternValidity', (): void => {
  it('Reverts if a pattern is empty.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity(''),
      'The pattern is empty.',
    );
  });

  it('Reverts if a pattern ends with an extension node.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('e'),
      'Pattern ends with an extension node.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('be'),
      'Pattern ends with an extension node.',
    );
  });

  it('Reverts if a pattern contains two consecutive extension nodes.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('eel'),
      'Pattern contains two consecutive extension nodes.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('beel'),
      'Pattern contains two consecutive extension nodes.',
    );
  });

  it('Reverts if a leaf node follows an extension nodes.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('el'),
      'Pattern contains a leaf node after an extension node.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('bel'),
      'Pattern contains a leaf node after an extension node.',
    );
  });

  it('Reverts if a leaf node is not the last one in pattern.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('lbb'),
      'Pattern does not end with leaf node.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('blbb'),
      'Pattern does not end with leaf node.',
    );
  });

  it('Reverts if a pattern does not end with two branch nodes.', (): void => {
    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('b'),
      'Pattern can end with double branch node only.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('eb'),
      'Pattern can end with double branch node only.',
    );

    assert.throws(
      (): void => FuzzyProofGenerator.assertPatternValidity('beb'),
      'Pattern can end with double branch node only.',
    );
  });

  it('Checks that an extension node can start a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebl'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebb'),
    );
  });

  it('Checks that a branch node can start a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bebl'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bebb'),
    );
  });

  it('Checks that a leaf node can start a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('l'),
    );
  });

  it('Checks that a branch node can end a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebb'),
    );
  });

  it('Checks that a leaf node can end a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('l'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bl'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebl'),
    );
  });

  it('Checks that a branch node can end a pattern.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebb'),
    );
  });

  it('Checks that a leaf node can follow a branch node.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bl'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bbl'),
    );
  });

  it('Checks that an extension node can follow a branch node.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebl'),
    );
  });

  it('Checks that a branch node can follow a branch node.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bbl'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebbl'),
    );
  });

  it('Checks that a branch node can follow an extension node.', (): void => {
    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('bebb'),
    );

    assert.doesNotThrow(
      (): void => FuzzyProofGenerator.assertPatternValidity('ebb'),
    );
  });
});
