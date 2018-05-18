pragma solidity ^0.4.19;

import "./util.sol";
import "./MerklePatriciaProof.sol";
import './RLPEncode.sol';
import "./BytesLib.sol";

// Contract for mirroring needed parts of the blockchain
contract Blockchain is Util {

    function Blockchain() public {
        assembly {
            // sstore(0x00, 0x999988887777666655554444333322221111)
            sstore(0x12000023000034000045000056, 0x999988887777666655554444333322221111)
        }
    }

    mapping (uint => bytes32) block_hash;

    struct BlockData {
        bytes32 stateRoot;
        bytes32 transactionRoot;
        mapping (uint => bytes32) transactions; // element 1 means not found
        mapping (address => bytes32) accounts;  // element 1 means not found
        uint numTransactions;
    }

    mapping (bytes32 => BlockData) block_data;

    struct TransactionData {
        address to;
        address sender;
        bytes data;
    }
    
    mapping (bytes32 => TransactionData) transactions;
    
    struct AccountData {
        bytes32 storageRoot;
        mapping (bytes32 => bytes32) stuff;
        mapping (bytes32 => bool) stuff_checked;
    }

    mapping (bytes32 => AccountData) accounts;

    function storeHashes(uint n) public {
        for (uint i = 1; i <= n; i++) block_hash[block.number-i] = block.blockhash(block.number-i);
    }

    function getBytes32(bytes rlp) internal pure returns (bytes32) {
        require(rlp.length == 33);
        bytes32 res;
        assembly {
            res := mload(add(33,rlp))
        }
        return res;
    }

    function getAddress(bytes rlp) internal pure returns (address) {
        if (rlp.length == 0) return 0;
        require(rlp.length == 21);
        return address(readSize(rlp, 1, 20));
    }

    function storeHeader(uint n, bytes header) public {
        // sanity check
        require(rlpArrayLength(header, 0) == 15);
        require(keccak256(header) == block_hash[n]);
        BlockData storage dta = block_data[block_hash[n]];
        dta.stateRoot = getBytes32(rlpFindBytes(header, 3));
        dta.transactionRoot = getBytes32(rlpFindBytes(header, 4));
    }

    function blockData(uint n) public view returns (bytes32, bytes32) {
        BlockData storage dta = block_data[block_hash[n]];
        return (dta.stateRoot, dta.transactionRoot);
    }

    function readTransactionSender(bytes32 hash, bytes tr) public pure returns (address) {
        // w
        uint v = readInteger(rlpFindBytes(tr, 6));
        // r
        uint r = readInteger(rlpFindBytes(tr, 7));
        // s
        uint s = readInteger(rlpFindBytes(tr, 8));
        return ecrecover(hash, v == 2710 ? 28 : 27, bytes32(r), bytes32(s));
//        return ecrecover(hash, uint8(v), bytes32(r), bytes32(s));
    }

    function updateNumTransactions(uint blk, uint num) public {
        BlockData storage dta = block_data[block_hash[blk]];
        require(uint(dta.transactions[num]) == 1);
        require(uint(dta.transactions[num-1]) > 1);
        dta.numTransactions = num + 1;
    }

    function storeTransaction(bytes tr) public {
        // read all the fields of transaction
        require(rlpArrayLength(tr, 0) == 9);
        bytes[] memory d = new bytes[](6);
        d[0] = rlpFindBytes(tr, 0); // nonce
        d[1] = rlpFindBytes(tr, 1); // price
        d[2] = rlpFindBytes(tr, 2); // gas
        d[3] = rlpFindBytes(tr, 3); // to
        d[4] = rlpFindBytes(tr, 4); // value
        d[5] = rlpFindBytes(tr, 5); // data
        
        uint len = d[0].length + d[1].length + d[2].length + d[3].length + d[4].length + d[5].length;
        
        // bytes32 hash = keccak256(arrayPrefix(len), d[0], d[1], d[2], d[3], d[4], d[5]);
        bytes32 hash = keccak256(arrayPrefix(len+5), d[0], d[1], d[2], d[3], d[4], d[5], bytes5(0x8205398080));
        // bytes32 hash = keccak256(arrayPrefix(len+5), sliceBytes(tr, rlpSizeLength(tr,0), len), bytes5(0x8080));
        TransactionData storage tr_data = transactions[keccak256(tr)];
        tr_data.sender = readTransactionSender(hash, tr);
        tr_data.to = getAddress(d[3]);
        tr_data.data = d[5]; // probably should remove RLP prefix
    }
    
    function trInfo(bytes32 hash) public view returns (address, address, bytes) {
        TransactionData storage tr = transactions[hash];
        return (tr.sender, tr.to, tr.data);
    }

    function storeAccount(bytes rlp) public {
        // read all the fields of account
        require(rlpArrayLength(rlp, 0) == 4);
        AccountData storage a_data = accounts[keccak256(rlp)];
        // 0 nonce
        // 1 balance
        // 2 storage
        // 3 code
        a_data.storageRoot = getBytes32(rlpFindBytes(rlp, 2));
    }
    
    // proof for transaction
    function transactionInBlock(bytes32 txHash, uint num, bytes parentNodes, uint blk) public {
        BlockData storage b = block_data[block_hash[blk]];
        bytes memory path = rlpInteger(num);
        require(MerklePatriciaProof.verify(txHash, path, parentNodes, b.transactionRoot));
        b.transactions[num] = txHash == keccak256() ? bytes32(uint(1)) : txHash;
    }

    function transactionDebug(bytes32 aHash, uint num, bytes parentNodes, uint blk) public view returns (bytes path, bool res, uint pos, bytes32 nkey, bytes nibbles) {
        BlockData storage b = block_data[block_hash[blk]];
        path = rlpInteger(num);
        nkey = b.transactionRoot;
        (res, pos, nibbles) = MerklePatriciaProof.verifyDebug(aHash, path, parentNodes, b.transactionRoot);
    }
    
    // proof for account
    function accountInBlock(bytes32 aHash, address addr, bytes parentNodes, uint blk) public {
        BlockData storage b = block_data[block_hash[blk]];
        bytes memory path = bytes32ToBytes(keccak256(addr));
        require(MerklePatriciaProof.verify(aHash, path, parentNodes, b.stateRoot));
        b.accounts[addr] = aHash;
    }

    /*
    function accountDebug(bytes32 aHash, address addr, bytes parentNodes, uint blk) public returns (bytes path, bool res, uint pos, bytes32 nkey, bytes nibbles) {
        BlockData storage b = block_data[block_hash[blk]];
        path = bytes32ToBytes(keccak256(addr));
        (res, pos, nibbles) = MerklePatriciaProof.verifyDebug(aHash, path, parentNodes, b.stateRoot);
    }
    */

    function accountData(uint n, address addr) public view returns (bytes32) {
        BlockData storage b = block_data[block_hash[n]];
        AccountData storage dta = accounts[b.accounts[addr]];
        return dta.storageRoot;
    }

    // proof for storage
    function storageInAccount(bytes32 aHash, bytes data, bytes32 ptr, bytes parentNodes) public {
        AccountData storage b = accounts[aHash];
        bytes memory path = bytes32ToBytes(keccak256(ptr));
        require(MerklePatriciaProof.verify(keccak256(data), path, parentNodes, b.storageRoot));
        if (data.length == 0) {
            b.stuff[ptr] = 0x0;
        }
        else {
            RLP.RLPItem memory item = RLP.toRLPItem(data);
            b.stuff[ptr] = RLP.toBytes32(item);
        }
        b.stuff_checked[ptr] = true;
    }

    function storageDebug(bytes32 aHash, bytes data, bytes32 ptr, bytes parentNodes) public view returns (bytes path, bool res, uint pos, bytes32 nkey, bytes nibbles) {
        AccountData storage b = accounts[aHash];
        path = bytes32ToBytes(keccak256(ptr));
        nkey = b.storageRoot;
        (res, pos, nibbles) = MerklePatriciaProof.verifyDebug(keccak256(data), path, parentNodes, b.storageRoot);
    }

    // Accessors
    function blockTransactions(uint blk) public view returns (uint) {
        uint num = block_data[block_hash[blk]].numTransactions;
        require (num > 0);
        return num-1;
    }

    function transactionSender(uint blk, uint num) public view returns (address) {
        bytes32 tr_hash = block_data[block_hash[blk]].transactions[num];
        require (uint(tr_hash) > 1);
        TransactionData storage tr = transactions[tr_hash];
        return tr.sender;
    }

    function transactionDebug(uint blk, uint num) public view returns (bytes32) {
        return block_data[block_hash[blk]].transactions[num];
    }
    
    function transactionReceiver(uint blk, uint num) public view returns (address) {
        bytes32 tr_hash = block_data[block_hash[blk]].transactions[num];
        require (uint(tr_hash) > 1);
        TransactionData storage tr = transactions[tr_hash];
        return tr.to;
    }

    function transactionData(uint blk, uint num) public view returns (bytes) {
        bytes32 tr_hash = block_data[block_hash[blk]].transactions[num];
        require (uint(tr_hash) > 1);
        TransactionData storage tr = transactions[tr_hash];
        return tr.data;
    }
    
    function transactionData32(uint blk, uint num) public view returns (bytes32) {
        bytes memory data = transactionData(blk, num);
        uint res = 0;
        for (uint i = 0; i < data.length && i < 32; i++) {
            res = res*256 + uint(data[i]);
        }
        return bytes32(res);
    }

    function accountStorage(uint blk, address addr, bytes32 ptr) public view returns (bytes32) {
        bytes32 a_hash = block_data[block_hash[blk]].accounts[addr];
        require (uint(a_hash) > 1);
        AccountData storage a = accounts[a_hash];
        require(a.stuff_checked[ptr]);
        return a.stuff[ptr];
    }

}

