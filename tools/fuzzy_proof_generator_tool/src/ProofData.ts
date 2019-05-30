export default interface ProofData {
  pattern: string;
  value: Buffer;
  encodedPath: Buffer;
  rlpParentNodes: Buffer;
  root: Buffer;
}
