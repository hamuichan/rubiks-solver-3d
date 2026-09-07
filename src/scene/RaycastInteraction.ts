import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Face, RotationDirection } from '../core/types';

interface DragState {
  isDragging: boolean;
  startScreenPos: THREE.Vector2;
  intersectedCubie: THREE.Mesh | null;
  worldNormal: THREE.Vector3;
  cubiePos: THREE.Vector3;
}

export class RaycastInteraction {
  private domElement: HTMLElement;
  private camera: THREE.Camera;
  private cubies: THREE.Mesh[];
  private orbitControls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private dragState: DragState = {
    isDragging: false,
    startScreenPos: new THREE.Vector2(),
    intersectedCubie: null,
    worldNormal: new THREE.Vector3(),
    cubiePos: new THREE.Vector3(),
  };

  private onMoveCallback?: (face: Face, direction: RotationDirection) => void;
  private isLocked = false;

  constructor(
    domElement: HTMLElement,
    camera: THREE.Camera,
    cubies: THREE.Mesh[],
    orbitControls: OrbitControls
  ) {
    this.domElement = domElement;
    this.camera = camera;
    this.cubies = cubies;
    this.orbitControls = orbitControls;

    this.bindEvents();
  }

  public setCubies(cubies: THREE.Mesh[]): void {
    this.cubies = cubies;
  }

  public setOnMove(callback: (face: Face, direction: RotationDirection) => void): void {
    this.onMoveCallback = callback;
  }

  public setLocked(locked: boolean): void {
    this.isLocked = locked;
  }

  private bindEvents(): void {
    this.domElement.addEventListener('pointerdown', this.onPointerDown, { capture: true });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  public destroy(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown, { capture: true });
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.isLocked || event.button !== 0) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cubies, false);

    const hit = intersects[0];
    if (hit && hit.face) {
      // 큐브 표면 클릭: 궤도 시점 회전을 차단하고 면 회전 드래그 모드 진입
      this.orbitControls.enabled = false;
      event.stopImmediatePropagation();

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
      const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      this.snapToPrincipalAxis(worldNormal);

      this.dragState = {
        isDragging: true,
        startScreenPos: new THREE.Vector2(event.clientX, event.clientY),
        intersectedCubie: hit.object as THREE.Mesh,
        worldNormal,
        cubiePos: hit.object.position.clone(),
      };
    } else {
      // 큐브 외부 클릭: 궤도 회전 허용
      this.orbitControls.enabled = true;
      this.dragState.isDragging = false;
      this.dragState.intersectedCubie = null;
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragState.isDragging || !this.dragState.intersectedCubie || this.isLocked) {
      return;
    }

    // 브라우저 화면 픽셀 좌표계 기준 이동 벡터 (+X: 오른쪽, +Y: 아래쪽)
    const deltaX = event.clientX - this.dragState.startScreenPos.x;
    const deltaY = event.clientY - this.dragState.startScreenPos.y;
    const dragDistance = Math.hypot(deltaX, deltaY);

    if (dragDistance < 12) return;

    const screenDrag = new THREE.Vector2(deltaX, deltaY);
    const result = this.resolveRotation(screenDrag);

    if (result && this.onMoveCallback) {
      this.onMoveCallback(result.face, result.direction);
    }

    this.endDrag();
  };

  private onPointerUp = (): void => {
    this.endDrag();
    this.orbitControls.enabled = true;
  };

  private endDrag(): void {
    this.dragState.isDragging = false;
    this.dragState.intersectedCubie = null;
  }

  // 스크린 픽셀 드래그 벡터와 3D 접선 기저 투영을 일치시켜 회전 축과 방향 산출
  private resolveRotation(
    screenDrag: THREE.Vector2
  ): { face: Face; direction: RotationDirection } | null {
    const normal = this.dragState.worldNormal;
    const cubiePos = this.dragState.cubiePos;

    // 해당 면에 직교하는 2개의 독립된 3D 접선 단위 벡터 설정
    const tangents: THREE.Vector3[] = [];
    if (Math.abs(normal.x) > 0.5) {
      tangents.push(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
    } else if (Math.abs(normal.y) > 0.5) {
      tangents.push(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1));
    } else {
      tangents.push(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
    }

    const origin2D = this.projectToScreen(cubiePos);
    let bestTangent: THREE.Vector3 | null = null;
    let maxDot = -Infinity;
    let sign = 1;

    for (const tangent of tangents) {
      const targetPos = cubiePos.clone().add(tangent);
      const target2D = this.projectToScreen(targetPos);
      const screenTangentDir = target2D.sub(origin2D);

      const length = screenTangentDir.length();
      if (length < 1e-4) continue;

      // 브라우저 픽셀 좌표계 동일 축 기준 내적 비교
      const dot = (screenDrag.x * screenTangentDir.x + screenDrag.y * screenTangentDir.y) / length;
      if (Math.abs(dot) > maxDot) {
        maxDot = Math.abs(dot);
        bestTangent = tangent;
        sign = Math.sign(dot);
      }
    }

    if (!bestTangent) return null;

    // 3D 드래그 방향 벡터 (V_drag)
    const dragWorldDir = bestTangent.clone().multiplyScalar(sign);

    // 마우스 드래그를 그대로 따라가게 만드는 회전 각속도 축: A_rot = V_drag x Normal
    const rotAxis = new THREE.Vector3().crossVectors(dragWorldDir, normal);
    this.snapToPrincipalAxis(rotAxis);

    const result = this.mapRotationAxisToFace(rotAxis, normal, cubiePos);
    if (!result) return null;

    // 사용자 체감 조작에 맞춘 회전 방향 반전
    return {
      face: result.face,
      direction: (result.direction === 1 ? -1 : 1) as RotationDirection,
    };
  }

  // 회전 각속도 축과 큐비 위치를 기준으로 대상 면 및 Singmaster 회전 방향(1 또는 -1) 결정
  private mapRotationAxisToFace(
    axis: THREE.Vector3,
    normal: THREE.Vector3,
    pos: THREE.Vector3
  ): { face: Face; direction: RotationDirection } | null {
    // 1. X축 회전인 경우 (대상 면: R 또는 L)
    if (Math.abs(axis.x) > 0.5) {
      let face: Face = 'R';
      if (pos.x < -0.2) {
        face = 'L';
      } else if (pos.x > 0.2) {
        face = 'R';
      } else {
        // 중앙 슬라이스 드래그 시 클릭된 면 자체의 회전으로 fallback
        face = normal.x < 0 ? 'L' : 'R';
      }

      // R: 시계(1) = -X축 회전 / L: 시계(1) = +X축 회전
      const direction: RotationDirection = face === 'R'
        ? (axis.x < 0 ? 1 : -1)
        : (axis.x > 0 ? 1 : -1);

      return { face, direction };
    }

    // 2. Y축 회전인 경우 (대상 면: U 또는 D)
    if (Math.abs(axis.y) > 0.5) {
      let face: Face = 'U';
      if (pos.y < -0.2) {
        face = 'D';
      } else if (pos.y > 0.2) {
        face = 'U';
      } else {
        face = normal.y < 0 ? 'D' : 'U';
      }

      // U: 시계(1) = -Y축 회전 / D: 시계(1) = +Y축 회전
      const direction: RotationDirection = face === 'U'
        ? (axis.y < 0 ? 1 : -1)
        : (axis.y > 0 ? 1 : -1);

      return { face, direction };
    }

    // 3. Z축 회전인 경우 (대상 면: F 또는 B)
    if (Math.abs(axis.z) > 0.5) {
      let face: Face = 'F';
      if (pos.z < -0.2) {
        face = 'B';
      } else if (pos.z > 0.2) {
        face = 'F';
      } else {
        face = normal.z < 0 ? 'B' : 'F';
      }

      // F: 시계(1) = -Z축 회전 / B: 시계(1) = +Z축 회전
      const direction: RotationDirection = face === 'F'
        ? (axis.z < 0 ? 1 : -1)
        : (axis.z > 0 ? 1 : -1);

      return { face, direction };
    }

    return null;
  }

  private projectToScreen(worldPos: THREE.Vector3): THREE.Vector2 {
    const p = worldPos.clone().project(this.camera);
    const rect = this.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((p.x + 1) * rect.width) / 2,
      ((-p.y + 1) * rect.height) / 2
    );
  }

  private snapToPrincipalAxis(v: THREE.Vector3): void {
    const ax = Math.abs(v.x);
    const ay = Math.abs(v.y);
    const az = Math.abs(v.z);
    if (ax > ay && ax > az) {
      v.set(Math.sign(v.x), 0, 0);
    } else if (ay > ax && ay > az) {
      v.set(0, Math.sign(v.y), 0);
    } else {
      v.set(0, 0, Math.sign(v.z));
    }
  }
}
