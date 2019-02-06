#! /usr/bin/env node
// Called like this:
// node merge_chainspec_accounts.js chainspec.json accounts.json
const fs = require('fs');

const chainspecPath = process.argv[2];
const accountsPath = process.argv[3];

const chainspec = JSON.parse(fs.readFileSync(chainspecPath));
const accounts = JSON.parse(fs.readFileSync(accountsPath));

Object.entries(accounts).forEach(([address, obj]) => {
  if (chainspec.accounts[address]) {
    console.warn(`Account at address ${address} already exists.`);
  }
  chainspec.accounts[address] = obj;
});

// Pretty print as JSON
process.stdout.write(JSON.stringify(chainspec, null, 4));
