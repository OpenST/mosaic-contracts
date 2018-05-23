const Trie = require('merkle-patricia-tree');
const levelup = require('levelup');
const leveldown = require('leveldown');
const ethUtil = require('ethereumjs-util');
const RLP = require('rlp');
const travesal = require('./traverse_trie');
const TrieNode = require('merkle-patricia-tree/trieNode');


let chainDataPath = "/Users/sarveshjain/Workspace/prodgeth/uc_node_backup_1409/geth/chaindata";

const db = levelup(leveldown(chainDataPath));
const root = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';
const accountAddress = "2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875";
const blockHash = "6181b9a000af555c71600b17cbdd5223e12521d3fb1d12db3fdba330a4f2cb20";

let path = Buffer.from(ethUtil.sha3(Buffer.from(accountAddress, 'hex')), 'hex');
//  console.log("getAccountProof.path", path);
// self.block.stateRoot is 64 length without 0x
let trie = new Trie(db, Buffer.from(root.slice(2), 'hex'));

trie.put

Trie.prove(trie, path, function (err, prove) {
  if (err) console.log(err);
  console.log("**********proof*************");
  console.log(prove);
  console.log(prove.length);
  // for(let i =0; i< prove.length; i++){
  //   console.log("***Node number ***",i);
  //   console.log(new TrieNode(RLP.decode(prove[i])));
  // }
  Trie.verifyProof(trie.root, path, prove, function (err, value) {
    if (err) return cb(err);
    console.log(value);
    let decodedValue = RLP.decode(value);
    console.log((decodedValue[0].toString()));
    console.log((decodedValue[1].toString()));
    console.log(decodedValue[2].toString());
    console.log(decodedValue[3].toString());
    console.log(value);
  })
});

//const trie = new Trie(db, root);
//travesal.traverse(trie.root,db);
// console.log(trie.root);
// db.get(trie.root).then((node) => {
//   console.log("Node  ", node);
//   console.log("decoded Node  ", RLP.decode(node));
// });

// trie.findPath(path,(a,b,c,d) => {
//   console.log()
// })
// Trie.prove(trie, ethUtil.toBuffer(accountAddress), function (err, prove) {
//   if (err) console.log(err);
//   console.log("prove", prove);
//   // Trie.verifyProof(trie.root, accountAddress, prove, function (err, value) {
//   //   if (err) return cb(err);
//   //   console.log(value.toString())
//   // })
// });