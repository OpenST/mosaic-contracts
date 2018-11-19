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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../test_lib/web3.js');
const testData = require('../../data/proof');
const KernelGateway = artifacts.require('TestKernelGateway');
const KernelGatewayFail = artifacts.require('TestKernelGatewayFail');
const BlockStore = artifacts.require('BlockStoreMock');
const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');

contract('KernelGateway.proveOriginCore()', async (accounts) => {

    const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";

    let originCore, kernelGateway, originBlockStore, auxiliaryBlockStore;

    let accountRlp = testData.account.rlpEncodedAccount;
    let accountBranchRlp = testData.account.rlpParentNodes;
    let stateRoot = testData.account.stateRoot;
    let originBlockHeight = new BN(100);

    let encodedPath;

    async function deploy(KernelGateway) {
        // deploy the kernel gateway
        originCore = accounts[1];
        originBlockStore = await BlockStore.new();
        auxiliaryBlockStore = await BlockStore.new();

        kernelGateway = await KernelGateway.new(
            originCore,
            originBlockStore.address,
            auxiliaryBlockStore.address,
            web3.utils.sha3('genesisKernelHash'),
        );

        encodedPath = await kernelGateway.encodedOriginCorePath();
        await originBlockStore.setStateRoot(stateRoot);
    }

    beforeEach(async function () {
        await deploy(KernelGateway);
    });

    it('should fail when rlp account is zero', async () => {

        await Utils.expectRevert(
            kernelGateway.proveOriginCore.call(
                "0x",
                accountBranchRlp,
                originBlockHeight,
            ),
            "The RLP encoded account must not be zero.",
        );
    });

    it('should fail when rlp account branch nodes is zero', async () => {

        await Utils.expectRevert(
            kernelGateway.proveOriginCore.call(
                accountRlp,
                "0x",
                originBlockHeight,
            ),
            "The RLP encoded account node path must not be zero.",
        );
    });

    it('should fail when state root for the given height is zero', async () => {

        await originBlockStore.setStateRoot(zeroBytes);

        await Utils.expectRevert(
            kernelGateway.proveOriginCore.call(
                accountRlp,
                accountBranchRlp,
                originBlockHeight,
            ),
            "The State root must not be zero.",
        );
    });

    it('should fail when merkle proof fails', async () => {

        await deploy(KernelGatewayFail);

        await Utils.expectRevert(
            kernelGateway.proveOriginCore.call(
                accountRlp,
                accountBranchRlp,
                originBlockHeight,
            ),
            "Account is not verified.",
        );
    });

    it('should fail when account RLP is not valid RLP encoded data', async () => {

        await Utils.expectRevert(
            kernelGateway.proveOriginCore.call(
                web3.utils.sha3('random'),
                accountBranchRlp,
                originBlockHeight,
            ),
            "VM Exception while processing transaction: revert",
        );
    });

    it('should pass with valid data', async () => {

        let result = await kernelGateway.proveOriginCore.call(
            accountRlp,
            accountBranchRlp,
            originBlockHeight,
        );

        assert(result, "Account proof must pass for valid data");

        let tx = await kernelGateway.proveOriginCore(
            accountRlp,
            accountBranchRlp,
            originBlockHeight,
        );

        let event = EventDecoder.getEvents(tx, kernelGateway);

        assert(
            event.OriginCoreProven !== undefined,
            "Event `OriginCoreProven` must be emitted.",
        );

        let eventData = event.OriginCoreProven;

        assert.strictEqual(
            web3.utils.toChecksumAddress(eventData._originCore),
            originCore,
            `Origin core address from event must be equal to ${originCore}`,
        );

        assert.equal(
            eventData._blockHeight,
            originBlockHeight,
            `Block height from event must be equal to ${originBlockHeight}`,
        );

        assert.strictEqual(
            eventData._storageRoot,
            testData.account.storageRoot,
            `Storage root from event must be equal to ${testData.account.storageRoot}`,
        );

        assert.strictEqual(
            eventData._wasAlreadyProved,
            false,
            `Storage root from event must be false`,
        );

        let storageRoot = await kernelGateway.storageRoots.call(originBlockHeight);

        assert.strictEqual(
            storageRoot,
            testData.account.storageRoot,
            `Storage root from contract must be equal to ${testData.account.storageRoot}`,
        );

    });

    it('should pass when the account is already proved for a given block ' +
        'height', async () => {

        let originBlockHeight = new BN(100);

        await kernelGateway.proveOriginCore(
            accountRlp,
            accountBranchRlp,
            originBlockHeight,
        );

        let tx = await kernelGateway.proveOriginCore(
            accountRlp,
            accountBranchRlp,
            originBlockHeight,
        );

        let event = EventDecoder.getEvents(tx, kernelGateway);

        assert(
            event.OriginCoreProven !== undefined,
            "Event `OriginCoreProven` must be emitted.",
        );

        let eventData = event.OriginCoreProven;

        assert.strictEqual(
            web3.utils.toChecksumAddress(eventData._originCore),
            originCore,
            `Origin core address from event must be equal to ${originCore}`,
        );

        assert.equal(
            eventData._blockHeight,
            originBlockHeight,
            `Block height from event must be equal to ${originBlockHeight}`,
        );

        assert.strictEqual(
            eventData._storageRoot,
            testData.account.storageRoot,
            `Storage root from event must be equal to ${testData.account.storageRoot}`,
        );

        assert.strictEqual(
            eventData._wasAlreadyProved,
            true,
            `Storage root from event must be false`,
        );
    });

});
