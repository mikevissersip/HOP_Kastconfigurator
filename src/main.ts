import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('app') || document.body;
const status = document.createElement('div');
status.className = 'status';
status.textContent = 'Loading kast.gltf...';
container.appendChild(status);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2229);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xddeeff, 0x34404b, 1.5));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

const loader = new GLTFLoader();
const modelUrl = new URL('kast.gltf', import.meta.env.BASE_URL).href;
loader.load(modelUrl, (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  status.remove();

  // Center the model at the origin so the controls and camera use the same target.
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  // Frame the camera using the model's largest dimension.
  const size = box.getSize(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z);
  const distance = largestDimension * 1.8;
  camera.position.set(distance, distance * 0.8, distance);
  controls.target.set(0, 0, 0);
  controls.update();
}, undefined, (err: unknown) => {
  console.error('Failed to load kast.gltf:', err);
  status.textContent = 'Could not load kast.gltf. Check that buffer.bin is also in public/.';
  status.classList.add('error');
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
