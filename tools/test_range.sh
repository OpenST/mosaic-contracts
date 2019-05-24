#!/bin/bash

# Copyright 2019 OpenST Ltd.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# ----------------------------------------------------------------------------
#
# http://www.simpletoken.org/
#
# ----------------------------------------------------------------------------

###
# Runs tests sequentially for a range of decimal values.
#
# Example run with decimals 12 - 18 (inclusive):
#
# ```bash
# npm run test:range -- 12 18
# ```
#
# You can provide only one argument and the tests will run for that specific
# decimal.
###

# Tracking the exit code to run further tests if they fail for a spcefic decimal.
EXIT_CODE=0

# Tracking failed decimals for error output.
FAILED_DECIMALS=""

function handle_error {
    # On first iteration, no extra comma
    if [ $EXIT_CODE -eq 0 ];
    then
        FAILED_DECIMALS="$1"
    else
        FAILED_DECIMALS="${FAILED_DECIMALS}, $1"
    fi
    EXIT_CODE=1
}

function handle_exit {
    if [ $EXIT_CODE -ne 0 ];
    then
        echo ""
        echo "### Errors for the following decimals:"
        echo "${FAILED_DECIMALS}"
        echo ""
    else
        echo ""
        echo "### Done"
        echo ""
    fi

    exit $EXIT_CODE
}

echo ""

if [ $# -ne 1 ] && [ $# -ne 2 ];
then
    echo "Wrong number of parameters given."
    echo "Run with two arguments: start and end of range inclusive."
    echo "Example:"
    echo "npm run test:range -- 16 20"
    echo ""
    echo "If you provide only one argument, the tests will be run for that value."
    echo ""
    exit 1
fi

# Start and end values should be provided on the command line.
START=$1

if [ $# -eq 1 ];
then
    END=$START
else
    END=$2
fi

for DECIMALS in $(seq "${START}" "${END}");
do
    echo "### Running tests with ${DECIMALS} decimals."
    export OPENST_DECIMALS=$DECIMALS
    npm test || handle_error $DECIMALS
done

handle_exit

