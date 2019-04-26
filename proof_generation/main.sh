#!/bin/bash

PROJECT_NAME='mosaic_proof_generator'

docker run --name mosaic -it -d -p 8546:8545 augurproject/dev-node-geth:v1.8.18
truffle --network integration_origin test generator.js
TEST_STATUS=$?
docker stop mosaic
docker rm mosaic

exit $TEST_STATUS
