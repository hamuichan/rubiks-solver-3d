declare module 'cubejs' {
  export default class Cube {
    constructor();
    static initSolver(): void;
    static fromString(str: string): Cube;
    solve(): string;
    asString(): string;
    isSolved(): boolean;
    clone(): Cube;
    move(alg: string): Cube;
    identity(): Cube;
  }
}
