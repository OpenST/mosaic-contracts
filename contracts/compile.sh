#! /bin/sh

mkdir -p "./bin"

echo ""
echo "Compiling Staking.sol"
echo ""

solc --combined-json=abi,bin Staking.sol > ./bin/Staking.json

echo ""
echo "Compiling UtilityToken.sol"
echo ""

solc --combined-json=abi,bin UtilityToken.sol > ./bin/UtilityToken.json
