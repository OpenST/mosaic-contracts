const RLP = require('rlp'),
  TrieNode = require('merkle-patricia-tree/trieNode');

function makeTrieNode(node) {
  let trieNode;
  if (TrieNode.isRawNode(node)) {

    trieNode = new TrieNode(node)
  } else {
    let decodedNode = RLP.decode(node);
    trieNode = new TrieNode(decodedNode);
  }
  return trieNode;
}

function processNode(trieNode, db) {
  console.log(trieNode);
  switch (trieNode.type) {
    case 'branch':
      for (let i = 0; i < 16; i++) {
        if (trieNode.raw[i].toString().trim().length > 0) {
          if (Array.isArray(trieNode.raw[i])) {
            processNode(new TrieNode(trieNode.raw[i]), db);
          }
          else {
            traverseTree(trieNode.raw[i], db);
          }
        }
      }
      if (trieNode.raw[16].toString().trim().length > 0) {
        console.log("value stored at branch", trieNode.raw[16].toString());
      }
      break;
    case 'leaf':
      console.log("leaf detected", trieNode.raw[1].toString());
      break;
    case 'extention':
      //processedNode = new TrieNode(trieNode);
      //proces db.get(row[1])
      traverseTree(trieNode.raw[1], db);
      break;
  }
}

function traverseTree(root, db) {
  db.get(root, {encoding: 'binary'})
    .then((node) => {
      let trieNode = makeTrieNode(node);
      processNode(trieNode, db);
    })
}

module.exports.traverse = (root, db) => {
  console.log("input")
  traverseTree(root, db);
}



