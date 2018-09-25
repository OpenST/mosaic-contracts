## Writing Unit Tests

- Truffle framework is used for unit tests.
- All tests are written in javascript.
- Solidity tests can be written if its needed.
- Test should be a comprehensive covering all the test cases, 
  including balance checks, event checks
- Test coverage must be 100%
- Tests should be well documented wherever required. If there are magic numbers
  or any magic inputs used then it should be documented for understanding.
- All tests must be able to run independently.    

####File locations

- All the mock contract, test contract and wrapper contracts used for testing 
are located in `contracts/test` folder.
- All the test files are located in `test/` folder
    
Directory structure is as shown below: 

```
mosaic-contracts/
        contracts/
            test/ <------ all the test/mock/wrapper contracts
                <testcontract1.sol>
                <testcontract1.sol>        
        test/  <------ all module directory
            <module_name>/
                <contract_name>/<------ all tests related to contract
                    <testfile1.js>
                    <testfile2.js>
                    <testfile3.js>                    
```
- <module_name> can be a module like gateway, core, lib etc.
- <contract_name> is the name of the contract inside the module. Examples for 
  this can be gateway, cogateway, core etc
- <testfile1.js> is the actual unit test file for a particular function. It 
  includes all the testcase of that function  

Example:
```
    mosaic-contracts/
        contracts/
            test/ <------ all the test/mock/wrapper contracts
                TestRLP.sol
                TestMockToken.sol        
        test/ 
            gateway/
                gateway/ <------ all the unit test related to gateway contract are located here
                    test_gateway.js
                    helper.js 
                    stake.js 
                    initiateGatewayLink.js 
                cogateway/ <------ all the unit test related to gateway contract are located here
                    test_co_gateway.js 
                    helper.js 
                    redeem.js                                                                                         
```    

####Naming convention

- All the test contracts located in `contracts/test` should start with
 **Test**_Xxxx_.sol 
- All the wrapper contracts located in `contracts/test` should start with
 **TestWrapper**_Xxxx_.sol 
- All the mock contracts located in `contracts/test` should start with
 **Mock**_Xxxx_.sol
- The directories and file names should be in snake case naming style 
  e.g `snake_case_naming` 
  
####Testing pattern / framwork

- all contracts have a test_xxxxx.js file. This file includes a comprehensive 
  asserts for pass and fail cases for all the functions in the contract.
- These functions have 4 paramters `params`, `resultType`, `expectedResults` 
  and `txOptions`   
  
  - `params` is actual function params<br>
  - `resultType` is whats expected status i.e `SUCCESS` or `FAIL`<br>
  - `expectedResults` is expected return and event values i.e. `{returns: 
  {key:value}, events: eventName:{key:value}}`
  - `txOptions` is actual tx options i.e `{from: sender, value: 100}`
             
  ```javascript
  Example: 
  async initiateGatewayLink(
        params,
        resultType,
        expectedResults,
        txOptions ) {

        const oThis = this;

        let coGateway = params.coGateway,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            hashLock = params.hashLock,
            signature = params.signature;

        if (resultType == utils.ResultType.FAIL) {

            await utils.expectThrow(gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            ));
        } else {

            let result = await gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                result,
                expectedResults.returns.messageHash,
                "messageHash must match"
            );

            let response = await gateway.initiateGatewayLink(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                response.receipt.status,
                1,
                "Receipt status is unsuccessfull"
            );
            let eventData = response.logs;

            utils.validateEvents(eventData, expectedResults.events);
            //oThis.validateEvents(eventData, expectedResults.events);
        }
    }
  
    ``` 
- all contract can have a helper file. This is a contract interact file that 
  can we used to get some data for contract for testing   

    ```
    Example:
        async getNonce (address) {
            const oThis = this;
            return await oThis.gateway.getNonce.call(address);
        },
    ```
- In the test files. `beforeEach` will populate all the data that will result 
  in to success of the test. The test cases in `it` will override the variables
  as per the test conditions. The data for `params`, `resultType`, 
  `expectedResults` and `txOptions` is prepared and the function is called in 
  test_xxxxx.js
  
    ```javascript
    Example:
  
  const web3 = require('web3'),
      Bignumber = require("bignumber.js");
  
  const Gateway = artifacts.require("Gateway"),
      MockToken = artifacts.require("MockToken");
  
  const GatewayUtilsKlass = require("../../../test/gateway/gateway/gateway_utils"),
      utils = require("../../../test/lib/utils"),
      Helper = require("../../../test/gateway/gateway/helper");
  
  const gatewayUtils = new GatewayUtilsKlass();
  const InitiateGatewayLink = function(){};
  
  let mockToken,
      gateway,
      gatewayHelper,
      nonce,
      intentHash,
      signData,
      txOption,
      sender,
      typeHash,
      coGatewayAddress,
      hashLock,
      organisationAddress,
      bounty,
      facilitator;
  
  InitiateGatewayLink.prototype = {
      initiateGatewayLink: async function (resultType) {
          let params = {
              coGateway: coGatewayAddress,
              intentHash: intentHash,
              nonce: nonce,
              sender: sender,
              hashLock: hashLock.l,
              signature: signData.signature
          };
  
          let expectedResult = {
              returns: {messageHash: signData.digest},
              events: {
                  GatewayLinkInitiated: {
                      _messageHash: signData.digest,
                      _gateway: gateway.address,
                      _cogateway: coGatewayAddress,
                      _token: mockToken.address,
                  }
              }
          };
  
          await gatewayUtils.initiateGatewayLink(
              params,
              resultType,
              expectedResult,
              txOption
          );
      },
  
      perform: function (accounts) {
  
          const oThis = this;
  
          const tokenName = "MockToken",
              tokenSymbol = "MOCK",
              tokenDecimals = 18;
  
          beforeEach(async function() {
              organisationAddress = accounts[2],
              bounty = new Bignumber(100),
              facilitator = accounts[4];
              hashLock = utils.generateHashLock();
  
              // deploy Mocktoken
              coGatewayAddress = accounts[3];
  
              mockToken = await MockToken.new();
  
              let deploymentParams = {
                  token: mockToken.address,
                  bountyToken: mockToken.address,
                  core: accounts[1],
                  bounty: bounty,
                  organisation: organisationAddress
              };
  
              // deploy gateway
              gateway = await gatewayUtils.deployGateway(
                  deploymentParams,
                  utils.ResultType.SUCCESS
              );
  
              // gateway helper.
              gatewayHelper = new Helper(gateway);
  
              typeHash = await gatewayHelper.gatewayLinkTypeHash();
  
              sender = organisationAddress;
              nonce = await gatewayHelper.getNonce(sender);
  
              intentHash = await gatewayHelper.hashLinkGateway(
                  gateway.address,
                  coGatewayAddress,
                  bounty,
                  tokenName,
                  tokenSymbol,
                  tokenDecimals,
                  nonce,
                  mockToken.address
              );
  
              signData = await utils.signHash(
                  typeHash,
                  intentHash,
                  nonce,
                  new Bignumber(0),
                  new Bignumber(0),
                  sender);
  
              txOption = {
                  from: facilitator
              };
          });
  
          it('fails when CoGateway is 0', async function() {
              coGatewayAddress = 0;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when sender is 0', async function() {
              sender = 0;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when signature is 0', async function() {
              signData.signature = 0;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when signature length is not 65', async function() {
              signData.signature = hashLock.s;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when nonce is does not match the nonce in contract',
              async function() {
                  nonce = new Bignumber(2);
                  await oThis.initiateGatewayLink(utils.ResultType.FAIL);
              }
          );
  
          it('fails when sender is not the signer', async function() {
              sender = accounts[8];
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when intent hash is invalid', async function() {
              intentHash = hashLock.s;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('fails when signature is invalid', async function() {
              let sign = await utils.signHash(
                  typeHash,
                  hashLock.s,
                  nonce,
                  new Bignumber(0),
                  new Bignumber(0),
                  sender);
              signData.signature = sign.signature;
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
  
          it('Successfully initiates Gateway linking', async function() {
              await oThis.initiateGatewayLink(utils.ResultType.SUCCESS);
              await oThis.initiateGatewayLink(utils.ResultType.FAIL);
          });
      }
  };
  
  module.exports = InitiateGatewayLink;


    ```   