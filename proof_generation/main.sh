#!/bin/bash

PROJECT_NAME='mosaic_proof_generator'

docker-compose --project-name $PROJECT_NAME up &
truffle --network integration_origin test generator.js
TEST_STATUS=$?
docker-compose --project-name $PROJECT_NAME down

exit $TEST_STATUS
