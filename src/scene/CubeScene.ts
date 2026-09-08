import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Face, RotationDirection } from '../core/types';
import { createAllCubies, disposeTextureCache } from './CubieMesh';
import { RotationManager } from './RotationManager';
import { RaycastInteraction } from './RaycastInteraction';

export class CubeScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private cubeGroup: THREE.Group;
  private cubies: THREE.Mesh[] = [];
  private shadowMesh: THREE.Mesh | null = null;

  private rotationManager: RotationManager;
  private interaction: RaycastInteraction;

  private isRunning = false;
  private animationFrameId = 0;
  private onMoveCallback?: (face: Face, direction: RotationDirection) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(5.2, 4.2, 6.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupFloorShadow();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 14;

    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);
    this.initCubies();

    this.rotationManager = new RotationManager(this.cubeGroup);
    this.interaction = new RaycastInteraction(
      this.renderer.domElement,
      this.camera,
      this.cubies,
      this.controls
    );

    this.interaction.setOnMove((face, direction) => {
      if (this.rotationManager.getIsRotating()) return;
      this.rotateFace(face, direction, 220).then(() => {
        if (this.onMoveCallback) {
          this.onMoveCallback(face, direction);
        }
      });
    });

    this.isRunning = true;
    this.renderLoop();
  }

  public setOnMove(callback: (face: Face, direction: RotationDirection) => void): void {
    this.onMoveCallback = callback;
  }

  public getIsRotating(): boolean {
    return this.rotationManager.getIsRotating();
  }

  public async rotateFace(
    face: Face,
    direction: RotationDirection,
    durationMs: number = 250
  ): Promise<void> {
    this.interaction.setLocked(true);
    try {
      await this.rotationManager.rotateFace(face, direction, durationMs);
    } finally {
      this.interaction.setLocked(false);
    }
  }

  public resetCube(): void {
    while (this.cubeGroup.children.length > 0) {
      this.cubeGroup.remove(this.cubeGroup.children[0]);
    }
    this.cubies.forEach((cubie) => {
      cubie.geometry.dispose();
      if (Array.isArray(cubie.material)) {
        cubie.material.forEach((m) => m.dispose());
      }
    });
    this.cubies = [];
    this.initCubies();
    this.rotationManager = new RotationManager(this.cubeGroup);
    this.interaction.setCubies(this.cubies);
  }

  public handleResize(width: number, height: number): void {
    if (height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);

    this.interaction.destroy();
    this.rotationManager.dispose();
    this.controls.dispose();

    // 1. 큐비 지오메트리 및 머티리얼 리소스 해제
    this.cubies.forEach((cubie) => {
      cubie.geometry.dispose();
      if (Array.isArray(cubie.material)) {
        cubie.material.forEach((m) => m.dispose());
      }
    });
    this.cubies = [];

    // 2. 바닥 그림자 메시 및 텍스처 해제
    if (this.shadowMesh) {
      this.shadowMesh.geometry.dispose();
      const mat = this.shadowMesh.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.dispose();
      }
      mat.dispose();
      this.shadowMesh = null;
    }

    // 3. 캐시된 캔버스 텍스처 및 씬 그래프 정리
    disposeTextureCache();
    this.scene.clear();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  private initCubies(): void {
    this.cubies = createAllCubies();
    for (const cubie of this.cubies) {
      this.cubeGroup.add(cubie);
    }
  }

  private setupLighting(): void {
    // 웜 톤의 은은한 주변광
    const ambientLight = new THREE.AmbientLight(0x2a2724, 0.9);
    this.scene.add(ambientLight);

    // 주광원 (Key Light)
    const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.2);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    // 보조광원 (Fill Light)
    const fillLight = new THREE.DirectionalLight(0xdbe7ff, 0.9);
    fillLight.position.set(-7, -4, -6);
    this.scene.add(fillLight);

    // 림 라이트 (Rim / Edge Light)
    const rimLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    rimLight.position.set(-5, 8, -7);
    this.scene.add(rimLight);
  }

  // 큐브 하단 부드러운 접촉 그림자 평면
  private setupFloorShadow(): void {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');

    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = -2.25;
    this.scene.add(this.shadowMesh);
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };
}
