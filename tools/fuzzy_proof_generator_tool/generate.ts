import * as fs from 'fs';
import * as path from 'path';

import FuzzyProofGenerator from './src/FuzzyProofGenerator';
import ProofData from './src/ProofData';
import patterns from './patterns';

interface HexProof {
  pattern: string;
  value: string;
  encodedPath: string;
  rlpParentNodes: string;
  root: string;
}

/** Converts a buffer to a hex string with a leading 0x. */
function bufferToHex(buffer: Buffer): string {
  return `0x${buffer.toString('hex')}`;
}

/** Converts a proof to a hex proof. */
function proofToHexProof(proof: ProofData): HexProof {
  return {
    pattern: proof.pattern,
    value: bufferToHex(proof.value),
    encodedPath: bufferToHex(proof.encodedPath),
    rlpParentNodes: bufferToHex(proof.rlpParentNodes),
    root: bufferToHex(proof.root),
  };
}

const proofs: ProofData[] = [];

// Run 4 times to generate more data.
for (let i = 0; i < 4; i += 1) {
  patterns.forEach(
    (pattern: string): number => proofs.push(FuzzyProofGenerator.generateByPattern(pattern)),
  );
}

// Convert to hex to be in line with the rest of the code base.
const hexProofs: HexProof[] = proofs.map(
  (proof: ProofData): HexProof => proofToHexProof(proof),
);

const filePath: string = path.join(
  __dirname,
  '..',
  '..',
  'test',
  'data',
  'generatedProofData.json',
);

fs.writeFileSync(filePath, JSON.stringify(hexProofs));
