#!/usr/bin/env bash

# local PoA geth - PoA geth

add-apt-repository -y ppa:ethereum/ethereum
apt-get update
# apt install -y build-essential
apt-get install -y ethereum solc

#wget https://nodejs.org/dist/v8.7.0/node-v8.7.0.tar.gz
#tar zxf node-v8.7.0.tar.gz node-v8.7.0
#cd node-v8.7.0
#./configure && make && make install

wget -q https://nodejs.org/dist/v8.7.0/node-v8.7.0-linux-x64.tar.xz
tar -xf node-v8.7.0-linux-x64.tar.xz
mv node-v8.7.0-linux-x64 /usr/local
ln -s /usr/local/node-v8.7.0-linux-x64/bin/node /usr/local/bin/node
ln -s /usr/local/node-v8.7.0-linux-x64/bin/npm /usr/local/bin/npm
ln -s /usr/local/node-v8.7.0-linux-x64/bin/npx /usr/local/bin/npx
rm node-v8.7.0-linux-x64.tar.xz

npm install -g truffle
export PATH="$PATH:/usr/local/node-v8.7.0-linux-x64/bin"