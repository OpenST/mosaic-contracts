const SolidityParser = require("solparse");


//todo We can extend this test for all the solidity contracts. But it's out of scope for now
const contracts = [
  {
  name: "OpenSTUtility.sol",
  path: "./contracts/gateway/OpenSTUtility.sol"
  },
  {
    name: "OpenSTValue.sol",
    path: "./contracts/gateway/OpenSTValue.sol"
  },
  {
    name: "Gateway.sol",
    path: "./contracts/gateway/Gateway.sol"
  }
];
const validSequence = ["event", "constant", "mapping", "variable", "array", "struct"];

function getContract(result) {
  return result.body.filter(e => {
    if (e.type === "ContractStatement") {
      return e;
    }
  });
}

function checkElementDataType(element) {
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

function isDataTypeDeclaredInContract(dataTypesInContract, currentDataType) {
  return dataTypesInContract.indexOf(currentDataType) !== -1;
}

function getContractVariables(parsedFile) {

  let contract = getContract(parsedFile);
  return contract[0].body;
}

function getListOfDataTypesInContract(file,) {

  let parsedFile = SolidityParser.parseFile(file.path);
  let contractBody = getContractVariables(parsedFile);

  return contractBody.map(element => checkElementDataType(element)).filter(t => t !== 'unknown');
}

describe('Contract Structure Test', async () => {

  contracts.map(file => {
    let dataTypesInContract = getListOfDataTypesInContract(file);
    for (let i = 0; i < validSequence.length; i++) {
      it('In ' + file.name + ' verify ' + validSequence[i] + ' is declared at right position', async () => {
        let currentDataType = validSequence[i];
        if (isDataTypeDeclaredInContract(dataTypesInContract, currentDataType)) {
          let currentDatatypePosition = -1;
          let nonCurrentDataTypePosition = -1;
          for (let t = 0; t < dataTypesInContract.length; t++) {
            if (currentDataType === dataTypesInContract[t]) {
              currentDatatypePosition = t;
            }
            else if (validSequence.indexOf(dataTypesInContract[t]) > i) {
              nonCurrentDataTypePosition = t;
            }
            let message = `${dataTypesInContract[nonCurrentDataTypePosition]} is declared before ${currentDataType}`;
            //check if non current datatype is not defined before current type
            assert.equal(nonCurrentDataTypePosition > -1 && currentDatatypePosition === -1, false, message);
            //non current data type should be defined after current data type
            assert.equal(nonCurrentDataTypePosition > currentDatatypePosition || nonCurrentDataTypePosition === -1, true, message);
          }
        }
      });
    }
  });

});