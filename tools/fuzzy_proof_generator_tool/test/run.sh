#!/bin/bash

npm run compile:ts && \
mocha -r ts-node/register tools/fuzzy_proof_generator_tool/test/**/*.test.ts

# Currently failing.
# Please, comment out once it's clear how to handle stored value of a branch node.
# truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generate.js && \
# truffle test ./tools/fuzzy_proof_generator_tool/test/FuzzyProofGenerator/generateByPattern.js
