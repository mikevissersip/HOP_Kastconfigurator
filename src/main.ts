import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stage = document.getElementById('viewer-stage');
if (!stage) throw new Error('Viewer stage not found');

// status indicator
let status = document.querySelector('.status') as HTMLElement | null;
if (!status) {
  status = document.createElement('div');
  status.className = 'status';
  stage.appendChild(status);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefefe);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
camera.position.set(3, 2.2, 4.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0xfefefe, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.outputColorSpace may not exist in older three versions; guard it
if ((renderer as any).outputColorSpace !== undefined) {
  (renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace;
}
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

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const frontLight = new THREE.DirectionalLight(0xffffff, 1.3);
frontLight.position.set(4, 4, 6);
scene.add(frontLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.9);
backLight.position.set(-5, 3, -6);
scene.add(backLight);

const sideLight = new THREE.DirectionalLight(0xffffff, 0.75);
sideLight.position.set(0, 6, 0);
scene.add(sideLight);

const loader = new GLTFLoader();
let currentModel: THREE.Object3D | null = null;
let currentTimeout: number | null = null;

function disposeModel(obj: THREE.Object3D) {
  obj.traverse((o) => {
    if (!(o as any).isMesh) return;
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) {
      try { mesh.geometry.dispose(); } catch (e) { /* ignore */ }
    }
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m: any) => {
        if (m.map) { try { m.map.dispose(); } catch {} }
        if (m.dispose) try { m.dispose(); } catch {}
      });
    } else if (mesh.material) {
      const m: any = mesh.material;
      if (m.map) { try { m.map.dispose(); } catch {} }
      if (m.dispose) try { m.dispose(); } catch {}
    }
  });
}

function setStatus(text: string, isError = false) {
  if (!status) return;
  status.textContent = text;
  status.classList.toggle('error', isError);
  if (!document.body.contains(status)) stage.appendChild(status);
}

function loadModelFile(filename: string) {
  // clear existing timeout
  if (currentTimeout) {
    window.clearTimeout(currentTimeout);
    currentTimeout = null;
  }

  setStatus('Loading 3D model...');

  const url = `${import.meta.env.BASE_URL}${filename}`;
  currentTimeout = window.setTimeout(() => {
    setStatus('Still loading 3D model...', true);
  }, 10000);

  loader.load(
    url,
    (gltf) => {
      if (currentTimeout) { window.clearTimeout(currentTimeout); currentTimeout = null; }

      // remove prior model
      if (currentModel) {
        scene.remove(currentModel);
        disposeModel(currentModel);
        currentModel = null;
      }

      const model = gltf.scene;

      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const meshMaterial = object.material;
        const materials = Array.isArray(meshMaterial) ? meshMaterial : [meshMaterial];

        materials.forEach((material: any) => {
          if (!material || !('color' in material)) return;
          const color = material.color as THREE.Color;
          if (color) {
            color.offsetHSL(0, 0, 1.08);
          }
          if ('metalness' in material) {
            material.metalness = 0.95;
          }
          if ('roughness' in material) {
            material.roughness = 0.00;
          }
        });
      });

      scene.add(model);
      currentModel = model;

      // center model and position camera
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z);
      const distance = Math.max(2, largestDimension * 1.8);
      camera.position.set(distance, distance * 0.7, distance);
      controls.target.set(0, 0, 0);
      controls.update();

      // hide status
      if (status && status.parentElement) status.remove();
    },
    (progress) => {
      if (progress.total > 0) {
        setStatus(`Loading 3D model... ${Math.round((progress.loaded / progress.total) * 100)}%`);
      }
    },
    (err) => {
      if (currentTimeout) { window.clearTimeout(currentTimeout); currentTimeout = null; }
      console.error('Failed to load 3D model:', err);
      setStatus('Could not load the 3D model.', true);
    }
  );
}

type ConfiguratorStep = 1 | 2;

interface SelectedCabinet {
  id: string;
  name: string;
  modelFile: string;
}

interface SelectedDoor {
  id: string;
  name: string;
  modelFile: string;
}

interface ConfiguratorState {
  currentStep: ConfiguratorStep;
  selectedCabinet: SelectedCabinet | null;
  selectedDoor: SelectedDoor | null;
}

const configuratorState: ConfiguratorState = {
  currentStep: 1,
  selectedCabinet: null,
  selectedDoor: null,
};

// wire up buttons
const kast1 = document.getElementById('kast1-btn') as HTMLButtonElement | null;
const kast2 = document.getElementById('kast2-btn') as HTMLButtonElement | null;
const kast3 = document.getElementById('kast3-btn') as HTMLButtonElement | null;
const selectedNameEl = document.getElementById('selected-name');
const selectedDoorNameEl = document.getElementById('selected-door-name');
const step1NextBtn = document.getElementById('step1-next-btn') as HTMLButtonElement | null;
const step2NextBtn = document.getElementById('step2-next-btn') as HTMLButtonElement | null;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement | null;
const configStep1 = document.getElementById('config-step-1') as HTMLElement | null;
const configStep2 = document.getElementById('config-step-2') as HTMLElement | null;

const leftDoor  = document.getElementById('doorLeft-btn') as HTMLButtonElement | null;
const rightDoor = document.getElementById('doorRight-btn') as HTMLButtonElement | null;

function setActiveButton(btn: Element | null) {
  document.querySelectorAll('.model-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const name = btn ? (btn.textContent || '').trim() : 'Geen selectie';
  if (selectedNameEl) selectedNameEl.textContent = name;
}

function setActiveDoorButton(btn: Element | null) {
  document.querySelectorAll('.model-btn-door').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const name = btn ? (btn.textContent || '').trim() : 'Geen selectie';
  if (selectedDoorNameEl) selectedDoorNameEl.textContent = name;
}

function showStep(step: ConfiguratorStep) {
  configuratorState.currentStep = step;
  if (configStep1) configStep1.hidden = step !== 1;
  if (configStep2) configStep2.hidden = step !== 2;
}

function applyDoorOrientation(isLeftHinge: boolean) {
  if (!currentModel) return;
  currentModel.scale.x = isLeftHinge ? -1 : 1;
  currentModel.rotation.set(0, 0, 0);
  currentModel.position.x = 0;
}

if (kast1) kast1.addEventListener('click', () => {
  const file = kast1.dataset.model || 'kast.gltf';
  loadModelFile(file);
  setActiveButton(kast1);
});
if (kast2) kast2.addEventListener('click', () => {
  const file = kast2.dataset.model || 'kast2.gltf';
  loadModelFile(file);
  setActiveButton(kast2);
});
if (kast3) kast3.addEventListener('click', () => {
  const file = kast3.dataset.model || 'kast3.gltf';
  loadModelFile(file);
  setActiveButton(kast3);
});

if (leftDoor) {
  leftDoor.addEventListener('click', () => {
    configuratorState.selectedDoor = {
      id: leftDoor.id,
      name: leftDoor.textContent?.trim() || 'Deur links',
      modelFile: leftDoor.dataset.door || 'door1.gltf',
    };
    setActiveDoorButton(leftDoor);
    applyDoorOrientation(true);
  });
}

if (rightDoor) {
  rightDoor.addEventListener('click', () => {
    configuratorState.selectedDoor = {
      id: rightDoor.id,
      name: rightDoor.textContent?.trim() || 'Deur rechts',
      modelFile: rightDoor.dataset.door || 'door2.gltf',
    };
    setActiveDoorButton(rightDoor);
    applyDoorOrientation(false);
  });
}

if (step1NextBtn) {
  step1NextBtn.addEventListener('click', () => {
    showStep(2);
  });
}

if (backBtn) {
  backBtn.addEventListener('click', () => {
    showStep(1);
  });
}

if (step2NextBtn) {
  step2NextBtn.addEventListener('click', () => {
    if (configuratorState.selectedDoor) {
      console.log('Selected door:', configuratorState.selectedDoor.name);
    }
  });
}

// initial model
const initialFile = (kast1 && kast1.dataset.model) ? kast1.dataset.model : 'kast.gltf';
loadModelFile(initialFile);
setActiveButton(kast1);
showStep(1);

if (rightDoor) setActiveDoorButton(rightDoor);

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
