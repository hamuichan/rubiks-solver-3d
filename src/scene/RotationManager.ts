import * as THREE from 'three';
import { Face, RotationDirection } from '../core/types';

export class RotationManager {
  private cubeGroup: THREE.Group;
  private pivotGroup: THREE.Group;
  private isRotating = false;

  constructor(cubeGroup: THREE.Group) {
    this.cubeGroup = cubeGroup;
    this.pivotGroup = new THREE.Group();
    this.cubeGroup.add(this.pivotGroup);
  }

  public getIsRotating(): boolean {
    return this.isRotating;
  }

  public getCubiesForFace(face: Face): THREE.Mesh[] {
    const cubies: THREE.Mesh[] = [];
    const threshold = 0.5;

    for (const child of this.cubeGroup.children) {
      if (child === this.pivotGroup) continue;
      if (!(child instanceof THREE.Mesh) || !child.userData.isCubie) continue;

      const pos = child.position;
      let matches = false;

      switch (face) {
        case 'U':
          matches = pos.y > threshold;
          break;
        case 'D':
          matches = pos.y < -threshold;
          break;
        case 'R':
          matches = pos.x > threshold;
          break;
        case 'L':
          matches = pos.x < -threshold;
          break;
        case 'F':
          matches = pos.z > threshold;
          break;
        case 'B':
          matches = pos.z < -threshold;
          break;
      }

      if (matches) {
        cubies.push(child);
      }
    }

    return cubies;
  }

  public rotateFace(
    face: Face,
    direction: RotationDirection,
    durationMs: number = 250
  ): Promise<void> {
    if (this.isRotating) {
      return Promise.reject(new Error('이미 회전 애니메이션이 진행 중입니다.'));
    }

    this.isRotating = true;
    const targetCubies = this.getCubiesForFace(face);

    // 피벗 그룹 상태 리셋 후 타겟 큐비 부착
    this.pivotGroup.rotation.set(0, 0, 0);
    this.pivotGroup.position.set(0, 0, 0);
    this.pivotGroup.updateMatrixWorld(true);

    for (const cubie of targetCubies) {
      this.pivotGroup.attach(cubie);
    }

    // 면별 정면 시점 기준 시계방향 회전축 및 기본 각도 산출
    let axis = new THREE.Vector3();
    let baseAngle = 0;

    switch (face) {
      case 'U':
        axis.set(0, 1, 0);
        baseAngle = -Math.PI / 2;
        break;
      case 'D':
        axis.set(0, 1, 0);
        baseAngle = Math.PI / 2;
        break;
      case 'R':
        axis.set(1, 0, 0);
        baseAngle = -Math.PI / 2;
        break;
      case 'L':
        axis.set(1, 0, 0);
        baseAngle = Math.PI / 2;
        break;
      case 'F':
        axis.set(0, 0, 1);
        baseAngle = -Math.PI / 2;
        break;
      case 'B':
        axis.set(0, 0, 1);
        baseAngle = Math.PI / 2;
        break;
    }

    let targetAngle = 0;
    if (direction === 1) {
      targetAngle = baseAngle;
    } else if (direction === -1) {
      targetAngle = -baseAngle;
    } else if (direction === 2) {
      targetAngle = baseAngle * 2;
    }

    return new Promise<void>((resolve) => {
      // 즉시 회전 (duration 0) 처리
      if (durationMs <= 0) {
        this.pivotGroup.rotateOnAxis(axis, targetAngle);
        this.pivotGroup.updateMatrixWorld(true);
        this.finalizeRotation(targetCubies);
        this.isRotating = false;
        resolve();
        return;
      }

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // 부드러운 시작과 감속을 위한 ease-in-out 사인 보간
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        this.pivotGroup.rotation.set(0, 0, 0);
        this.pivotGroup.rotateOnAxis(axis, targetAngle * ease);
        this.pivotGroup.updateMatrixWorld(true);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.finalizeRotation(targetCubies);
          this.isRotating = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 회전 종료 시 부동소수점 오차 누적을 완전히 제거하는 좌표 및 회전축 스냅 보정
  private finalizeRotation(cubies: THREE.Mesh[]): void {
    for (const cubie of cubies) {
      this.cubeGroup.attach(cubie);

      // 1. 위치 좌표 정수 스냅 (-1, 0, 1)
      cubie.position.set(
        Math.round(cubie.position.x),
        Math.round(cubie.position.y),
        Math.round(cubie.position.z)
      );

      // 2. 주축 단위 벡터 정규화 및 직교 기저 행렬 스냅
      const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(cubie.quaternion);
      const basisX = new THREE.Vector3().setFromMatrixColumn(rotMatrix, 0);
      const basisY = new THREE.Vector3().setFromMatrixColumn(rotMatrix, 1);
      const basisZ = new THREE.Vector3().setFromMatrixColumn(rotMatrix, 2);

      const snapVector = (v: THREE.Vector3) => {
        const absX = Math.abs(v.x);
        const absY = Math.abs(v.y);
        const absZ = Math.abs(v.z);
        if (absX > absY && absX > absZ) {
          v.set(Math.sign(v.x), 0, 0);
        } else if (absY > absX && absY > absZ) {
          v.set(0, Math.sign(v.y), 0);
        } else {
          v.set(0, 0, Math.sign(v.z));
        }
      };

      snapVector(basisX);
      snapVector(basisY);
      basisZ.crossVectors(basisX, basisY).normalize();

      const snappedMatrix = new THREE.Matrix4().makeBasis(basisX, basisY, basisZ);
      cubie.quaternion.setFromRotationMatrix(snappedMatrix);

      cubie.updateMatrix();
      cubie.updateMatrixWorld(true);
    }
  }
}
