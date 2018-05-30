let SolidityParser = require("solparse");


function getContract(result) {
  return result.body.filter(e => {
    if (e.type === "ContractStatement") {
      return e;
    }
  });
}

function checkElementType(element) {
  if (element.type === "EventDeclaration") {
    return 'event';
  }
  if (element.type === "StateVariableDeclaration" && element.is_constant) {
    return 'constant';
  }
  if (element.type === "StateVariableDeclaration" && typeof(element.literal.literal) === 'object' && element.literal.literal.type === "MappingExpression") {
    return 'mapping';
  }

  if (element.type === "StateVariableDeclaration" && typeof(element.literal.literal) === 'string' && element.literal.array_parts.length > 0) {
    return 'array';
  }
  if (element.type === "StateVariableDeclaration" && typeof(element.literal.literal) === 'string') {
    return 'variable';
  }
  if (element.type === "StructDeclaration") {
    return "struct";
  }
  return "unknown";

}

describe('Contract Structure Test', async () => {
  let validSequence = ["event", "constant", "mapping", "variable", "array", "struct"];
  let types;
  before(async () => {
    let result = SolidityParser.parseFile("./contracts/TestContract.sol");
    let contract = getContract(result);
    let contractBody = contract[0].body;
    types = contractBody.map(element => checkElementType(element)).filter(t => t !== 'unknown');
  });

  for (let i = 0; i < validSequence.length; i++) {

    it('Verify ' + validSequence[i] + ' is declared at right position', async () => {
      let currentTypePosition = -1;
      let nonCurrentTypePosition = -1;
      for (let t = 0; t < types.length; t++) {
        if (validSequence[i] === types[t]) {
          currentTypePosition = t;
        }
        else if (validSequence.indexOf(types[t]) > i) {
          nonCurrentTypePosition = t;
        }

        let message = types[nonCurrentTypePosition] + " is declared before " + types[currentTypePosition];
        assert.equal(nonCurrentTypePosition > -1 && currentTypePosition == -1, false, message) //check if noncurrent type is defined but current type is not defined
        assert.equal(nonCurrentTypePosition > currentTypePosition || nonCurrentTypePosition == -1, true, message)
      }

    });
  }

});