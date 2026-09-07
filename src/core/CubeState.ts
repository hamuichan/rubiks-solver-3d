import Cube from 'cubejs';
import { ICubeState, FaceletState, ColorCode } from './types';

export class CubeState implements ICubeState {
  private internalCube: InstanceType<typeof Cube>;

  constructor(cubeInstance?: InstanceType<typeof Cube>) {
    this.internalCube = cubeInstance ? cubeInstance.clone() : new Cube();
  }

  public static fromSolved(): CubeState {
    return new CubeState();
  }

  public static fromString(kociembaString: string): CubeState {
    const cube = Cube.fromString(kociembaString);
    return new CubeState(cube);
  }

  public get facelets(): FaceletState {
    return this.internalCube.asString().split('') as ColorCode[];
  }

  public isSolved(): boolean {
    return this.internalCube.isSolved();
  }

  public clone(): CubeState {
    return new CubeState(this.internalCube);
  }

  public toKociembaString(): string {
    return this.internalCube.asString();
  }

  public applyMove(notation: string): CubeState {
    const clean = notation.trim();
    if (!clean) return this;

    this.internalCube.move(clean);
    return this;
  }
}
