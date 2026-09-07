import * as THREE from 'three';
import { CUBIE_SIZE, CUBIE_SPACING, FACE_COLORS } from './constants';

// 각 면의 프리미엄 라운디드 타일 텍스처 생성 (고해상도 512x512)
function createFaceTexture(colorHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. 외부 플라스틱 프레임 바디 (딥 챠콜)
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, 512, 512);

    // 2. 둥근 모서리 컬러 타일
    const padding = 34;
    const size = 512 - padding * 2;
    const radius = 42;
    const x = padding;
    const y = padding;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    // 타일 베이스 색상 채우기
    const hexString = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexString;
    ctx.fill();

    // 3. 미세한 타일 표면 빛 반사 그라데이션
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 4. 타일 테두리 미세 베벨 하이라이트 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 텍스처 및 머티리얼 캐싱
const textureCache = new Map<number, THREE.CanvasTexture>();

function getCachedTexture(colorHex: number): THREE.CanvasTexture {
  if (!textureCache.has(colorHex)) {
    textureCache.set(colorHex, createFaceTexture(colorHex));
  }
  return textureCache.get(colorHex)!;
}

const innerMaterial = new THREE.MeshStandardMaterial({
  color: FACE_COLORS.BODY,
  roughness: 0.65,
  metalness: 0.1,
});

function createFaceMaterial(faceColor: number | null): THREE.Material {
  if (faceColor === null) {
    return innerMaterial;
  }

  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: getCachedTexture(faceColor),
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.12,
  });
}

export function createCubie(x: number, y: number, z: number): THREE.Mesh {
  const materials: THREE.Material[] = [
    createFaceMaterial(x === 1 ? FACE_COLORS.R : null),
    createFaceMaterial(x === -1 ? FACE_COLORS.L : null),
    createFaceMaterial(y === 1 ? FACE_COLORS.U : null),
    createFaceMaterial(y === -1 ? FACE_COLORS.D : null),
    createFaceMaterial(z === 1 ? FACE_COLORS.F : null),
    createFaceMaterial(z === -1 ? FACE_COLORS.B : null),
  ];

  const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
  const mesh = new THREE.Mesh(geometry, materials);

  mesh.position.set(x * CUBIE_SPACING, y * CUBIE_SPACING, z * CUBIE_SPACING);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    initialCoords: { x, y, z },
    isCubie: true,
  };

  return mesh;
}

export function createAllCubies(): THREE.Mesh[] {
  const cubies: THREE.Mesh[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        cubies.push(createCubie(x, y, z));
      }
    }
  }

  return cubies;
}
