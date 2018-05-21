const Trie = require('merkle-patricia-tree'),
  levelup = require('levelup'),
  leveldown = require('leveldown'),
  traversal = require('./traverseTrie'),
  db = levelup(leveldown('./testdb')),
  trie = new Trie(db);



let key1 = new Buffer([11, 11, 11]);
let key2 = new Buffer([12, 22, 22]);
let key3 = new Buffer([12, 33, 33]);
let key4 = new Buffer([12, 33, 44]);
console.log("key1", key1)
console.log("key2", key2)
console.log("key3", key3)
console.log("key4", key4)
trie.put(key1, 'first', () => {
  trie.put(key2, 'create the first branch', () => {
    trie.put(key3, 'create the middle branch', () => {
      trie.put(key4, 'create the last branch', () => {
        //traverseTree(trie.root);
        traversal.traverse(trie.root, db);
      });
    });
  });
});

