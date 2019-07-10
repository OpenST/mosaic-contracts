#!/bin/bash

./node_modules/.bin/tsc -p ./tools/tools_tsconfig.json && \
mocha -r ts-node/register tools/fuzzy_proof_generator_tool/test/**/*.test.ts && \
truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generate.js && \
truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generateByPattern.js
