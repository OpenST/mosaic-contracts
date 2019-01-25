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

const colors = require('colors/safe');

/**
 * Check if the provided address contains a EIP20Token.
 *
 * Only checks if the provided address contains code.
 *
 * @param {object} web3 The web3 instance to use.
 * @param {string} eip20Address The address to check whether it contains
 *                 an EIP20Token.
 */
const checkEip20Address = async (web3, eip20Address) => {
    const contractCode = await web3.eth.getCode(eip20Address);
    if (!contractCode) {
        console.warn(colors.red('There is no contract present at the specified address!'));
    }
};

module.exports = {
    checkEip20Address,
};
