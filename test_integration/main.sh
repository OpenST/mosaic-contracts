#!/bin/bash

PROJECT_NAME='mosaic_integration_tests'

docker-compose --project-name $PROJECT_NAME up &
truffle --network integration_origin exec integration_tests.js
docker-compose --project-name $PROJECT_NAME down
