const web3 = require('../../test_lib/web3.js');

const GatewayHelper = function(gateway) {
  const oThis = this;
  oThis.gateway = gateway;
};
GatewayHelper.prototype = {
  // Utils
  async isAddress(address) {
    return await web3.utils.isAddress(address);
  },

  // Deployment functions
  async deployGateway(params, resultType) {
    const valueTokenAddress = params.token;

    const bountyToken = params.bountyToken;

    const stateRootProviderAddress = params.stateRootProviderAddress;

    const bountyAmount = params.bounty;

    const organizationAddress = params.organization;

    if (resultType === utils.ResultType.FAIL) {
      await utils.expectThrow(
        Gateway.new(
          valueTokenAddress,
          bountyToken,
          stateRootProviderAddress,
          bountyAmount,
          organizationAddress,
        ),
      );
    } else {
      this.gateway = await Gateway.new(
        valueTokenAddress,
        bountyToken,
        stateRootProviderAddress,
        bountyAmount,
        organizationAddress,
      );

      const addressValidationResult = await this.isAddress(
        this.gateway.address,
      );

      assert.equal(addressValidationResult, true, 'Invalid gateway address');

      const tokenAdd = await this.gateway.token.call();
      assert.equal(
        tokenAdd,
        valueTokenAddress,
        'Invalid valueTokenAddress address from contract',
      );

      const bountyTokenAdd = await this.gateway.baseToken.call();
      assert.equal(
        bountyTokenAdd,
        bountyToken,
        'Invalid bounty token address from contract',
      );

      const stateRootProviderAdd = await this.gateway.stateRootProvider.call();
      assert.equal(
        stateRootProviderAdd,
        stateRootProviderAddress,
        'Invalid state root provider address from contract',
      );

      const bounty = await this.gateway.bounty.call();
      assert.equal(
        bounty.toString(10),
        bountyAmount.toString(10),
        'Invalid bounty amount from contract',
      );

      const orgAdd = await this.gateway.organization.call();
      assert.equal(
        orgAdd,
        organizationAddress,
        'Invalid organizationAddress address from contract',
      );
    }

    return this.gateway;
  },
};
module.exports = GatewayHelper;
