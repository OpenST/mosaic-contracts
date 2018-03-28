#!/bin/sh

CONTRACTDIR=./contracts/*.sol
ABIDIRUTILITY=./contracts/abi
BINDIRVALUE=./contracts/bin

mkdir -p "$ABIDIRUTILITY"
mkdir -p "$BINDIRVALUE"

for filename in $CONTRACTDIR; do
    echo ""
    echo "Compiling ${filename}"
    echo ""
    solc --abi --optimize --optimize-runs 200 --overwrite ${filename} -o $ABIDIRUTILITY
    solc --bin --optimize --optimize-runs 200 --overwrite ${filename} -o $BINDIRVALUE
done