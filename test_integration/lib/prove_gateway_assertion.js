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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const assert = require('assert');

/**
 * Class to assert prove gateway.
 */
class ProveGatewayAssertion {
  /**
     *
     * @param {Object} event Decoded event for Gateway Proven.
     * @param {BN} blockHeight Block height at which prove gateway is done.
     * @param {string} storageRoot Storage root of gateway account at give
     *                             height.
     * @param {string}gateway Gateway address
     */
  static verify(event, blockHeight, storageRoot, gateway) {
    const eventData = event.GatewayProven;

    assert.strictEqual(
      eventData._blockHeight.eq(blockHeight),
      true,
      `Block height from event ${eventData._blockHeight.toString(10)} 
            is different from expected ${blockHeight} `,
    );

    assert.strictEqual(
      eventData._storageRoot,
      storageRoot,
      `Storage root from event ${eventData._storageRoot} 
            is different from expected ${storageRoot} `,
    );

    assert.strictEqual(
      eventData._wasAlreadyProved,
      false,
      'Already proven should be false',
    );

    assert.strictEqual(
      eventData._gateway,
      gateway,
      'Proven gateway must match.',
    );
  }
}

module.exports = ProveGatewayAssertion;
