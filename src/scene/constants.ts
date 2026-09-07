import * as THREE from 'three';
import { Face } from '../core/types';

export const CUBIE_SIZE = 0.94;
export const CUBIE_SPACING = 1.0;
export const TILE_SIZE = 0.84;
export const TILE_DEPTH = 0.03;

// 프리미엄 스피드큐브 WCA 컬러 팔레트
export const FACE_COLORS = {
  U: 0xfafafa, // 상단(Up): 퓨어 화이트 (White)
  D: 0xf59e0b, // 하단(Down): 웜 카나리아 옐로우 (Yellow)
  F: 0x10b981, // 전면(Front): 에메랄드 그린 (Green)
  B: 0x2563eb, // 후면(Back): 코발트 블루 (Blue)
  L: 0xf97316, // 좌측(Left): 네온 탠저린 오렌지 (Orange)
  R: 0xef4444, // 우측(Right): 브라이트 레드 (Red)
  BODY: 0x141416, // 큐비 코어 바디: 매트 딥 챠콜
};

export const FACE_NORMALS: Record<Face, THREE.Vector3> = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
  L: new THREE.Vector3(-1, 0, 0),
  R: new THREE.Vector3(1, 0, 0),
};
