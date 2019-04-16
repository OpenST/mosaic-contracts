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

const GatewayBase = artifacts.require('./MockGatewayBase.sol');

const MockAnchor = artifacts.require('./MockAnchor.sol');

const BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');

contract('GatewayBase.sol', (accounts) => {
  describe('prove gateway', async () => {
    const rlpAccount = '0xf8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7cd03224e3b2a03159b6460da05b7534dec07bb70fb401032a60cb5a9d67f2bd2f50dfad5f2656c3c2fe8f2675';
    const rlpParentNodes = '0xf908cef90211a0f113fc83479a9dcb7a7b5c98cdb42f24260f4d12b82003c3a99c0396d58918e4a007da904438ce6e90091514622c5f43816ebda4b28edb7d28c185af95b0b5d0bba0fa08a20a1e7b354aea4186ce7a56c66f08e0bad3d384ccbec3308b86a048f28da082faa84d23c856e00add29d83dffd20c640f7c4cb500a2f1b6ec345730518090a0db06fd0cd48958bdadc30f163ea9bb95d5cd1ca5605b649bca7a94f51e629b86a001cb1bae18830ad03bffb1ed8ad4c2c0338dfb6d4edc734b60d4751c838cf6d1a0b549ccb01890070dde0c2339fe189a54c3f9b5d6c0dee5c3228ec13ea8154f08a0fa860a8dd11a45a645c8f2add444311d0ce77e0e0153af518a8c82cd2a4e530ca0582c96d90db5da3e59dee0bb2ca191d97613717000c24f012539b61be5d777a9a0bc30df4754a90bde3a6f795a03f6cb2747f9180fa13087a249eda1993e38213ba04030ae5f6e34465c29bf9f164bd168e291fea360fa9ac6e2a01bcfaa29c97837a028f4323329a54f02e9fa6c65b9992b380602ce8d86f3c4ea6d1f799376eede97a099728882f75d2777db12440f90756cad8ce90637726e2949cc3039a310c0d26ba015e593e9d83137f2a6b3d6e79f3efdb62b7c2e0d4885f242392903c458adbecba0a022e3488e55dcdd8ff64c000e33f45c51a5fce1225647042ee26e512cfaf8aea03c35754a8a080ec63632e7b3d5fd2b653b4d217116dc74ec44c1eee04d2f611280f90211a056236df72b2a3baf3c4b110622911d48e8134dce5fab96dc4aa0e86bf1345f38a0e02f83a4f33cc5e624d7243d341d4b4d06a91e074250dbf2caebfa2c3e4765d0a0a72d49adff0c5e77dc9d95b4191d8d6668971f74077797659f83d415cd0fd1d1a0c60abc4f0a940d618cf9cea13adfaa4c03e3061bd702986daf5237d1065ef788a05d962c16915d89ede187bd317d3b90c6e4fdd076e53267e1857102cefadf22eda0926dc3780e5eefb8e262d98db26df3429404beb9ae838e69ba7c071d09891791a0a5f7008f700c2d6f10e14071c6471f62005f8409ed6af67a955ad7fb939c27caa0b558c2fee610404a708a543aebd8a729da27434f5608cbaa4691462c72874056a0faa4cce3c8599c6d984e9577ab6bd9b0c006068c31d9e03215cc8908114d7757a0a3d6d16c957326cd262da81bad6b7dee022e4dbd202adff5d7ccc4342a61d21fa0d55c004ac2e9eaec20c2cffef567de49df83fde291e52abc815db781dac5456ba06ab98c39c210c5e2a9ffb994afdefd5ca02bdceff8cfd8e60d68c199d864b94ca0522232d286697b81da8721463bce6e8dedff3330bc13c02937b78fe1afa9005ba0c3bf8ac2260dab7d0108b546f94e2c714aaea8b2274745b7575ded129520304ea0a481df0f7947c98bd4ea7738f706826df3031ae129e362fcfeca937e8651eb4ea05193d68afbd4b7509f77498f1587ea9e090697c2e95c4d2bafbb52a8cf9bd62480f90211a011561aaab4838e5fa61b9e6debfdba192744c612d2ba76ab61deb015746aa5a0a00026c65c973bbd95e6c0e980f4d22e4627715e5e9f421c80fc49f1f67f7b971fa00d119e6b55db30543e2065bc456dbe0828b97c1b0d217846c4ee787bee670d79a0bc563733a582905db3b2eb375218ff1b64cc9a12abc84ec663086a460a625394a093ff057cda650d4808cb25651fe2f77652107c4c56d9647fe75c8c0a3d2d0d64a06cf305021c9a1a175e01fe56f8ef8f527f8a69fc9042e9b1b0a4ba53ea3b0025a078a50de369a7bddf71b0f8bab722b4c34c56918eb051776a7cb8598c0011170ba0699884e0545d810a93c1c80a6ba48020ade2ada6b556764f937712c8628c033da00d02491b26b79333b5a3ec8ffd455921600cc327183d260ad4d4ed5d63fc2aa6a02d9468383a418e9303989bbad1845e3c48ef803bacea406e1fd68e25a565a9d2a0a4453049a044659669a5ff8c56229d339ea860b934ad895bab0ef865cce2fffea0d654be53e9c8fc64a068ef9cd7768eadbeb52bcaa764cececfa6be01b8e074f2a087f0f15350b42c7a8efe19eb64bf8b7ab13daeeebb40f4f3f8b3685b0fc0031ea0ce410da15fc84e9b8caf8d6785f241c74a6b70d5b62f71ba4a1d09ff47921d8da0fcf5effb792c9b1ca3fbffe251cdb27c0facf30d3445b3e230537df48399da69a042acf9ab2c371e984f2c280566ba342a4e0a081e555bbec957aab3296fb4af1980f901d1a07c6a2cff79b45c222da90c55b00dca5f51b62b0cbeff1a0c1f6984851be684daa097fa80b5e381a5d49663a6b86e8721843b93e534da0db48e1db74967c28d7e82a045009364e98f5b0ead865504e8209ccffb7fb63b2a28464717504a78141f518fa039bcfc875dbca2f973a7f5f2f19b55b3bc22f80f387413a12ee0dab5e0254107a009c6f751027ce16b579633a060bee4028dd0ba87567fadf0a887811d9ed7e594a0d0eba05cdd60831f8532710718106860bc2853dc628e55e286c78afe6f3891d0a0904d4bf3896ac04520fd93e47169b6bfff4c7cdf25420b342784abd7090f2dd4a0feb4a9be9f299e0f58645e4ae2f8e2c2082368d2e08a9cec0c6ae37411c56de9a0e30f69e6968d9611a3d52d210a282244316d31367642f2c4f159161fec71e269a0a665c800370015f89a458e68e95b96c4e6976347a6a5f76df6b58f1451bb8948a0120a7594596f36b628223057eb375c73653dfa6fcbfc3ec8d2ce201a685aaa9680a0c7bbde5d654a3bf527ae035eeba861d25280b88b7a0376bf7c39625d9ffd9879a005d5ae3d04a79a90f21af570116b6e4c29e6e606c877bf9b015a5f03e18d1e24a0b2b77afc6c3b77c6a171e5f49bd6508f455fbe93864c7c832a02b303e4f227e48080f8518080808080a081dc71924e3436de3a7ddd7cd6abcc0d7f8beb7d7186e388c7dabc158ad6e0b1808080808080a011947a5a80ea783ca7627105736c527e60b5565bb4af2a1fd594f7d9adc01e5d80808080f8699e3e4ced21ae7bedd22cd1f49238c2280cf1e50a14e8f5d2038e29f59f37afb848f8468206fb80a036ed801abf5678f1506f1fa61e5ccda1f4de53cc7cd03224e3b2a03159b6460da05b7534dec07bb70fb401032a60cb5a9d67f2bd2f50dfad5f2656c3c2fe8f2675';
    const stateRoot = '0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d';
    const storageRoot = '0x8c0ee0843488170879578464b1cadcdb7377efa787372405ff373e4cec6a56db';

    let gatewayBaseInstance;

    beforeEach(async () => {
      const owner = accounts[2];
      const worker = accounts[3];
      const bounty = new BN(100);
      const maxStateRoots = new BN(1000);
      const mockOrganization = await MockOrganization.new(owner, worker);
      const mockAnchor = await MockAnchor.new(
        1,
        0,
        stateRoot,
        maxStateRoots,
        mockOrganization.address,
      );

      gatewayBaseInstance = await GatewayBase.new(
        mockAnchor.address,
        bounty,
        mockOrganization.address,
      );
    });

    it('should be able to prove with correct request', async () => {
      const response = await gatewayBaseInstance.proveGateway(
        1,
        rlpAccount,
        rlpParentNodes,
      );

      const expectedEvent = {
        GatewayProven: {
          _gateway: 0,
          _blockHeight: new BN(1),
          _storageRoot: storageRoot,
          _wasAlreadyProved: false,
        },
      };

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );

      const eventData = response.logs;
      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should return already proven flag as true if already proven', async () => {
      await gatewayBaseInstance.proveGateway(2, rlpAccount, rlpParentNodes);

      const response = await gatewayBaseInstance.proveGateway(
        2,
        rlpAccount,
        rlpParentNodes,
      );

      const expectedEvent = {
        GatewayProven: {
          _gateway: 0,
          _blockHeight: new BN(2),
          _storageRoot: storageRoot,
          _wasAlreadyProved: true,
        },
      };

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );

      const eventData = response.logs;

      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should fail if rlp encoded account is not passed', async () => {
      await Utils.expectThrow(
        gatewayBaseInstance.proveGateway(1, '0x', rlpParentNodes),
      );
    });

    it('should fail if rlp parent nodes is not passed', async () => {
      await Utils.expectThrow(
        gatewayBaseInstance.proveGateway(1, rlpAccount, '0x'),
      );
    });
  });
});
