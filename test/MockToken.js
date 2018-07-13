const Utils = require('./lib/utils.js')
const SimpleTokenUtils = require('./SimpleToken_utils.js')

const Moment = require('moment')

const MockToken = artifacts.require("./MockToken.sol")


// Test Stories
//
// Finalize
//    - check properties before and after finalize
//    - try to finalize a 2nd time
//


contract('MockToken', (accounts) => {

   const SYMBOL         = "MOCK"
   const NAME           = "Mock Token"
   const admin          = accounts[1];

   async function createToken() {
      return await MockToken.new({ from: accounts[0], gas: 3500000 })
   }

   describe('Basic properties', async () => {

      var token = null

      before(async () => {
         token = await createToken()
      })

      it("symbol", async () => {
         assert.equal(await token.symbol.call(), SYMBOL)
      })

      it("name", async () => {
         assert.equal(await token.name.call(), NAME)
      })
   })
})
