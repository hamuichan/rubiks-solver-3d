import { ICubeState, FaceletState, Face, ColorCode } from './types';
import { 
  SOLVED_FACELETS, 
  SOLVED_KOCIEMBA_STRING,
  FACE_PERMUTATIONS 
} from './constants';

export class CubeState implements ICubeState {
  public facelets: FaceletState;

  constructor(facelets?: FaceletState) {
    this.facelets = facelets ? [...facelets] : [...SOLVED_FACELETS];
  }

  public static fromSolved(): CubeState {
    return new CubeState();
  }

  public isSolved(): boolean {
    return this.toKociembaString() === SOLVED_KOCIEMBA_STRING;
  }

  public clone(): CubeState {
    return new CubeState(this.facelets);
  }

  public toKociembaString(): string {
    return this.facelets.join('');
  }

  public applyMove(notation: string): CubeState {
    const cleanNotation = notation.trim();
    if (!cleanNotation) return this;

    const face = cleanNotation[0].toUpperCase() as Face;
    const isPrime = cleanNotation.includes("'");
    const isDouble = cleanNotation.includes('2');

    let turns = 1;
    if (isPrime) turns = 3;
    else if (isDouble) turns = 2;

    for (let i = 0; i < turns; i++) {
      this.rotateFaceClockwise(face);
    }

    return this;
  }

  // 기본 90도 시계방향 단일 면 순환 치환
  private rotateFaceClockwise(face: Face): void {
    const perm = FACE_PERMUTATIONS[face];
    const newFacelets = new Array(54) as ColorCode[];

    for (let i = 0; i < 54; i++) {
      newFacelets[i] = this.facelets[perm[i]];
    }

    this.facelets = newFacelets;
  }
}
