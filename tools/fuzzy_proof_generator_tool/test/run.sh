#!/bin/bash

npm run compile:ts && \
mocha -r ts-node/register tools/fuzzy_proof_generator_tool/test/**/*.test.ts && \
truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generate.js && \
truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generateByPattern.js
