import * as fs from 'fs';
import * as path from 'path';

import FuzzyProofGenerator from './src/FuzzyProofGenerator';
import ProofData from './src/ProofData';
import patterns from './patterns';

const proofs: ProofData[] = [];

// Run 4 times to generate more data.
for (let i = 0; i < 4; i += 1) {
  patterns.forEach(
    (pattern: string): number => proofs.push(FuzzyProofGenerator.generateByPattern(pattern)),
  );
}

const filePath: string = path.join(
  __dirname,
  '..',
  '..',
  'test',
  'data',
  'generatedProofData.json',
);

fs.writeFileSync(filePath, JSON.stringify(proofs));
