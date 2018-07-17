const Utils = require('./lib/utils.js')
const SimpleTokenUtils = require('./SimpleToken_utils.js')

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
   
   describe('Finalize', async () => {

      var token = null

      before(async () => {
         token = await createToken()

         await token.setAdminAddress(admin)
      })


      it("check properties before and after finalize", async () => {
         assert.equal(await token.finalized.call(), false)
         SimpleTokenUtils.checkFinalizedEventGroup(await token.finalize({ from: admin }))
         assert.equal(await token.finalized.call(), true)
      })

      it("try to finalize a 2nd time", async () => {
         await Utils.expectThrow(token.finalize.call({ from: admin }))
      })
   })
})
