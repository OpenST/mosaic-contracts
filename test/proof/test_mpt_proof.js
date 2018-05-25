const Trie = require('merkle-patricia-tree'),
  levelup = require('levelup'),
  leveldown = require('leveldown'),
  db = levelup(leveldown('./testdb')),
  trie = new Trie(db),
  traversal = require('./traverseTrie'),
  RLP = require('rlp'),
  TrieNode = require('merkle-patricia-tree/trieNode');


let key1 = new Buffer([11, 11, 11]);
let key2 = new Buffer([12, 22, 22]);
let key3 = new Buffer([12, 33, 33]);
let key4 = new Buffer([12, 33, 44]);
generateProof = () => {
  Trie.prove(trie, key4, function (err, prove) {
    if (err) console.log(err);

    let decodeNodeFromProff = RLP.decode(prove[prove.length -1]);

    console.log("prove", decodeNodeFromProff);
    //let trieNode = new TrieNode(decodeNodeFromProff.raw[1]);
   // console.log(trieNode);
    console.log(new TrieNode(decodeNodeFromProff[1]).raw[1].toString())
    Trie.verifyProof(trie.root, key4, prove, function (err, value) {
      if (err) return cb(err);
      console.log(value.toString());
      //traversal.traverse(trie.root,db);
    });
  });
};


console.log("key1", key1);
console.log("key2", key2);
console.log("key3", key3);
console.log("key4", key4);
trie.put(key1, 'first', () => {
  trie.put(key2, 'create the first branch', () => {
    trie.put(key3, 'create the middle branch', () => {
      trie.put(key4, 'create the last branch', () => {
        //traverseTree(trie.root);
        generateProof();
      });
    });
  });
});