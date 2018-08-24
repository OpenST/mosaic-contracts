#!/bin/sh

CONTRACT_DIR=./contracts/*/*.sol
ABI_DIR=./contracts/abi
BIN_DIR=./contracts/bin

mkdir -p "$ABI_DIR"
mkdir -p "$BIN_DIR"

for filename in $CONTRACT_DIR; do
    echo ""
    echo "Compiling ${filename}"
    echo ""
    solc --abi --optimize --optimize-runs 200 --overwrite ${filename} -o $ABI_DIR
    solc --bin --optimize --optimize-runs 200 --overwrite ${filename} -o $BIN_DIR
done