#!/bin/bash

PROJECT_NAME='mosaic_integration_tests'
LOGLEVEL='ERROR'

docker-compose --project-name $PROJECT_NAME --log-level $LOGLEVEL up &
truffle --network integration_origin exec integration_tests.js
docker-compose --project-name $PROJECT_NAME --log-level $LOGLEVEL down
