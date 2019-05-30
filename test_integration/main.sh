#!/bin/bash

PROJECT_NAME='mosaic_integration_tests'

docker-compose --project-name $PROJECT_NAME up &
docker logs mosaic_integration_tests_geth_node_origin_1
docker logs mosaic_integration_tests_geth_node_auxiliary_1
truffle --network integration_origin exec integration_tests.js
TEST_STATUS=$?
docker logs mosaic_integration_tests_geth_node_origin_1
docker logs mosaic_integration_tests_geth_node_auxiliary_1
docker-compose --project-name $PROJECT_NAME down

exit $TEST_STATUS
