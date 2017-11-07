#! /bin/sh

mkdir -p "./bin"
mkdir -p "./abi"

echo ""
echo "Compiling Staking.sol"
echo ""

solc --combined-json=abi,bin Staking.sol > ./bin/Staking.json
solc --abi Staking.sol > ./abi/Staking.json

echo ""
echo "Compiling UtilityToken.sol"
echo ""

solc --combined-json=abi,bin UtilityToken.sol > ./bin/UtilityToken.json
solc --abi UtilityToken.sol > ./abi/UtilityToken.json
