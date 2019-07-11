// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require('process');

/** Test wide configuration for various tests. */
const config = {
  /** Defaults to 18. Can be overriden with the environment variable OPENST_DECIMALS. */
  get decimals() {
    let decimals = 18;

    if (env.OPENST_DECIMALS) {
      decimals = Number.parseInt(env.OPENST_DECIMALS, 10);
    }

    return decimals;
  },
};

module.exports = config;
