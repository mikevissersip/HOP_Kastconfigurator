import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stage = document.getElementById('viewer-stage');
if (!stage) throw new Error('Viewer stage not found');

const status = document.createElement('div');
status.className = 'status';
status.textContent = 'Loading 3D model...';
stage.appendChild(status);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefefe);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
camera.position.set(3, 2.2, 4.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0xfefefe, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.5;
controls.maxDistance = 10;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc8d1, 1.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 8, 7);
scene.add(keyLight);

const loader = new GLTFLoader();
const modelUrl = `${import.meta.env.BASE_URL}untitled.gltf?v=2`;
const loadTimeout = window.setTimeout(() => {
  status.textContent = 'Still loading 3D model...';
  status.classList.add('error');
}, 10000);

loader.load(
  modelUrl,
  (gltf) => {
    window.clearTimeout(loadTimeout);
    const model = gltf.scene;

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const meshMaterial = object.material;
      const materials = Array.isArray(meshMaterial) ? meshMaterial : [meshMaterial];

      materials.forEach((material) => {
        if (!material || !('color' in material)) return;
        const color = material.color as THREE.Color;
        if (color) {
          color.offsetHSL(0, 0, -0.08);
        }
        if ('metalness' in material) {
          material.metalness = 0.15;
        }
        if ('roughness' in material) {
          material.roughness = 0.8;
        }
      });
    });

    scene.add(model);
    status.remove();

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z);
    const distance = largestDimension * 1.8;
    camera.position.set(distance, distance * 0.7, distance);
    controls.target.set(0, 0, 0);
    controls.update();
  },
  (progress) => {
    if (progress.total > 0) {
      status.textContent = `Loading 3D model... ${Math.round((progress.loaded / progress.total) * 100)}%`;
    }
  },
  (err: unknown) => {
    window.clearTimeout(loadTimeout);
    console.error('Failed to load 3D model:', err);
    status.textContent = 'Could not load the 3D model.';
    status.classList.add('error');
  }
);

const resizeRenderer = () => {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};

resizeRenderer();
window.addEventListener('resize', resizeRenderer);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
