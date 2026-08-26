import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stage = document.getElementById('viewer-stage');
if (!stage) throw new Error('Viewer stage not found');

const frontView2d = document.getElementById('front-view-2d') as HTMLDivElement | null;
const frontViewCanvas = document.createElement('canvas');
frontViewCanvas.className = 'front-view-canvas';
if (frontView2d) {
  frontView2d.prepend(frontViewCanvas);
}

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

const frontPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: frontViewCanvas });
frontPreviewRenderer.setClearColor(0x000000, 0);
frontPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
frontPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
frontPreviewRenderer.toneMappingExposure = 0.9;

const frontPreviewScene = new THREE.Scene();
const frontPreviewCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
frontPreviewCamera.position.set(0, 0, 2.5);
frontPreviewCamera.lookAt(0, 0, 0);

frontPreviewScene.add(new THREE.AmbientLight(0xffffff, 0.9));

const frontPreviewFrontLight = new THREE.DirectionalLight(0xffffff, 0.7);
frontPreviewFrontLight.position.set(3, 2, 5);
frontPreviewScene.add(frontPreviewFrontLight);

const frontPreviewSideLight = new THREE.DirectionalLight(0xffffff, 0.45);
frontPreviewSideLight.position.set(-4, 2, 3);
frontPreviewScene.add(frontPreviewSideLight);

const frontPreviewBackLight = new THREE.DirectionalLight(0xffffff, 0.35);
frontPreviewBackLight.position.set(0, 3, -5);
frontPreviewScene.add(frontPreviewBackLight);

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
      updateFrontPreview();

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

type ConfiguratorStep = 1 | 2 | 3;

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

interface ComponentCatalogItem {
  id: string;
  name: string;
  file?: string;
}

interface MountedComponent {
  id: string;
  name: string;
  itemId: string;
  x: number;
  y: number;
  mesh: THREE.Object3D | null;
  marker: HTMLDivElement | null;
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

const componentCatalog: ComponentCatalogItem[] = [
  { id: 'hoofdschakelaar', name: 'Hoofdschakelaar', file: 'hoofdschakelaar.gltf' },
  { id: 'zekering', name: 'Zekering' },
  { id: 'drukschakelaar', name: 'Drukschakelaar' },
  { id: 'signaallampje', name: 'Signaallampje' },
];

const mountedComponents: MountedComponent[] = [];
const frontViewZoomState = {
  value: 1,
  min: 0.5,
  max: 2.5,
};

function applyFrontViewZoom(nextValue: number) {
  if (!frontView2d) return;

  const contentWidth = 280;
  const contentHeight = 200;
  const maxByFrame = Math.max(
    1,
    Math.min(frontView2d.clientWidth / contentWidth, frontView2d.clientHeight / contentHeight)
  );

  const clamped = Math.min(
    Math.max(nextValue, frontViewZoomState.min),
    Math.min(frontViewZoomState.max, maxByFrame * 1.7)
  );

  frontViewZoomState.value = clamped;
  frontView2d.style.setProperty('--front-zoom', clamped.toFixed(2));
}

// wire up buttons
const kast1 = document.getElementById('kast1-btn') as HTMLButtonElement | null;
const kast2 = document.getElementById('kast2-btn') as HTMLButtonElement | null;
const kast3 = document.getElementById('kast3-btn') as HTMLButtonElement | null;
const selectedNameEl = document.getElementById('selected-name');
const selectedDoorNameEl = document.getElementById('selected-door-name');
const selectedComponentNameEl = document.getElementById('selected-component-name');
const step1NextBtn = document.getElementById('step1-next-btn') as HTMLButtonElement | null;
const step2NextBtn = document.getElementById('step2-next-btn') as HTMLButtonElement | null;
const step3BackBtn = document.getElementById('step3-back-btn') as HTMLButtonElement | null;
const step3NextBtn = document.getElementById('step3-next-btn') as HTMLButtonElement | null;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement | null;
const configStep1 = document.getElementById('config-step-1') as HTMLElement | null;
const configStep2 = document.getElementById('config-step-2') as HTMLElement | null;
const configStep3 = document.getElementById('config-step-3') as HTMLElement | null;
const addComponentBtn = document.getElementById('add-component-btn') as HTMLButtonElement | null;
const zoomInBtn = document.querySelector('.zoom-in') as HTMLButtonElement | null;
const zoomOutBtn = document.querySelector('.zoom-out') as HTMLButtonElement | null;
const componentMenu = document.getElementById('component-menu') as HTMLDivElement | null;
const componentLayer = document.getElementById('component-layer') as HTMLDivElement | null;
const doorPanel = document.getElementById('door-panel') as HTMLDivElement | null;

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
  if (configStep3) configStep3.hidden = step !== 3;
  if (componentMenu) componentMenu.hidden = true;
}

function updateDoorPanelLayout() {
  if (!doorPanel) return;
  const isLeftDoor = configuratorState.selectedDoor?.id === 'doorLeft-btn';
  doorPanel.style.left = isLeftDoor ? '0%' : '50%';
  doorPanel.style.width = '50%';
  doorPanel.style.borderLeft = isLeftDoor ? 'none' : '3px solid rgba(12, 27, 46, 0.28)';
  doorPanel.style.borderRight = isLeftDoor ? '3px solid rgba(12, 27, 46, 0.28)' : 'none';
}

function applyDoorOrientation(isLeftHinge: boolean) {
  if (!currentModel) return;
  currentModel.scale.x = isLeftHinge ? -1 : 1;
  currentModel.rotation.set(0, 0, 0);
  currentModel.position.x = 0;
  updateDoorPanelLayout();
  updateFrontPreview();
}

function updateFrontPreview() {
  if (!frontView2d || !frontViewCanvas || !currentModel) return;

  const rect = frontView2d.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  frontViewCanvas.width = Math.max(1, Math.round(width * window.devicePixelRatio));
  frontViewCanvas.height = Math.max(1, Math.round(height * window.devicePixelRatio));
  frontPreviewRenderer.setSize(width, height, false);
  frontPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  frontPreviewScene.clear();
  frontPreviewScene.add(new THREE.AmbientLight(0xffffff, 0.9));
  frontPreviewScene.add(frontPreviewFrontLight);
  frontPreviewScene.add(frontPreviewSideLight);
  frontPreviewScene.add(frontPreviewBackLight);

  const cloned = currentModel.clone(true);
  cloned.rotation.set(0, 0, 0);
  cloned.scale.set( configuratorState.selectedDoor?.id === 'doorLeft-btn' ? -1 : 1, 1, 1 );

  const box = new THREE.Box3().setFromObject(cloned);
  const center = box.getCenter(new THREE.Vector3());
  cloned.position.sub(center);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = Math.max(2.2, maxDim * 2.2);
  frontPreviewCamera.position.set(0, 0, distance);
  frontPreviewCamera.lookAt(0, 0, 0);
  frontPreviewCamera.aspect = width / height;
  frontPreviewCamera.updateProjectionMatrix();

  frontPreviewScene.add(cloned);
  cloned.updateMatrixWorld(true);

  const componentWorldPosition = new THREE.Vector3();
  const projectedPosition = new THREE.Vector3();
  mountedComponents.forEach((component) => {
    if (!component.mesh || !component.marker) return;

    component.mesh.getWorldPosition(componentWorldPosition);
    const clonedPosition = cloned.worldToLocal(componentWorldPosition.clone());
    cloned.localToWorld(clonedPosition);
    projectedPosition.copy(clonedPosition).project(frontPreviewCamera);

    component.marker.style.left = `${(projectedPosition.x + 1) * 50}%`;
    component.marker.style.top = `${(1 - projectedPosition.y) * 50}%`;
  });

  frontPreviewRenderer.render(frontPreviewScene, frontPreviewCamera);
}

function clearMountedComponents() {
  mountedComponents.forEach((item) => {
    if (item.mesh && item.mesh.parent) item.mesh.parent.remove(item.mesh);
    if (item.marker && item.marker.parentNode) item.marker.parentNode.removeChild(item.marker);
  });
  mountedComponents.length = 0;
  if (selectedComponentNameEl) selectedComponentNameEl.textContent = 'Geen onderdeel';
}

function convert2DTo3D(x: number, y: number, placeInFront = false) {
  if (!currentModel) {
    return new THREE.Vector3(0, 0, 0.15);
  }

  const box = new THREE.Box3().setFromObject(currentModel);
  const size = box.getSize(new THREE.Vector3());
  const targetX = THREE.MathUtils.lerp(-size.x * 0.28, size.x * 0.28, x);
  const targetY = THREE.MathUtils.lerp(size.y * 0.28, -size.y * 0.28, y);
  const frontOffset = placeInFront ? size.z * -0.47 : 0;
  const targetWorldPosition = new THREE.Vector3(targetX, targetY, size.z * 0.56 + frontOffset);
  currentModel.updateMatrixWorld(true);
  return currentModel.worldToLocal(targetWorldPosition);
}

function syncComponentPosition(component: MountedComponent) {
  const marker = component.marker;
  if (marker) {
    marker.style.left = `${Math.min(Math.max(component.x, 0), 1) * 100}%`;
    marker.style.top = `${Math.min(Math.max(component.y, 0), 1) * 100}%`;
  }

  if (component.mesh) {
    component.mesh.position.copy(convert2DTo3D(component.x, component.y, component.itemId === 'hoofdschakelaar'));
  }
  updateFrontPreview();
}

function setComponentSelectionLabel(name: string) {
  if (selectedComponentNameEl) selectedComponentNameEl.textContent = name;
  updateFrontPreview();
}

function createFallbackComponentMesh() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x5f7cff,
    metalness: 0.25,
    roughness: 0.5,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), material);
  group.add(box);
  return group;
}

function createComponentMarker(item: ComponentCatalogItem, component: MountedComponent) {
  const marker = document.createElement('div');
  marker.className = 'component-marker';
  marker.setAttribute('tabindex', '0');
  marker.title = item.name;
  marker.textContent = '•';
  marker.dataset.componentId = component.id;

  const beginDrag = (event: PointerEvent) => {
    event.preventDefault();
    const dragComponent = mountedComponents.find((entry) => entry.id === component.id);
    if (!dragComponent || !componentLayer) return;

    marker.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const rect = componentLayer.getBoundingClientRect();
      const px = (moveEvent.clientX - rect.left) / rect.width;
      const py = (moveEvent.clientY - rect.top) / rect.height;
      dragComponent.x = Math.min(Math.max(px, 0.08), 0.92);
      dragComponent.y = Math.min(Math.max(py, 0.08), 0.92);
      syncComponentPosition(dragComponent);
    };

    const stop = () => {
      marker.removeEventListener('pointermove', move);
      marker.removeEventListener('pointerup', stop);
      marker.removeEventListener('pointercancel', stop);
      marker.removeEventListener('lostpointercapture', stop);
    };

    marker.addEventListener('pointermove', move);
    marker.addEventListener('pointerup', stop);
    marker.addEventListener('pointercancel', stop);
    marker.addEventListener('lostpointercapture', stop);
  };

  marker.addEventListener('pointerdown', beginDrag);
  if (componentLayer) componentLayer.appendChild(marker);
  component.marker = marker;
}

function addComponentToScene(item: ComponentCatalogItem, x = 0.5, y = 0.5) {
  const componentId = `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const component: MountedComponent = {
    id: componentId,
    name: item.name,
    itemId: item.id,
    x,
    y,
    mesh: null,
    marker: null,
  };

  mountedComponents.push(component);
  createComponentMarker(item, component);
  syncComponentPosition(component);
  setComponentSelectionLabel(item.name);

  const attachMesh = (mesh: THREE.Object3D) => {
    if (!currentModel) return;
    mesh.position.copy(convert2DTo3D(component.x, component.y, component.itemId === 'hoofdschakelaar'));
    mesh.rotation.set(3.13, Math.PI, 0);
    currentModel.add(mesh);
    component.mesh = mesh;
    updateFrontPreview();
  };

  if (item.file) {
    const url = `${import.meta.env.BASE_URL}${item.file}`;
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(item.id === 'hoofdschakelaar' ? 1 : 0.25);
        attachMesh(model);
      },
      undefined,
      () => {
        attachMesh(createFallbackComponentMesh());
      }
    );
  } else {
    attachMesh(createFallbackComponentMesh());
  }
}

if (kast1) kast1.addEventListener('click', () => {
  const file = kast1.dataset.model || 'kast.gltf';
  clearMountedComponents();
  loadModelFile(file);
  setActiveButton(kast1);
});
if (kast2) kast2.addEventListener('click', () => {
  const file = kast2.dataset.model || 'kast2.gltf';
  clearMountedComponents();
  loadModelFile(file);
  setActiveButton(kast2);
});
if (kast3) kast3.addEventListener('click', () => {
  const file = kast3.dataset.model || 'kast3.gltf';
  clearMountedComponents();
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
    updateDoorPanelLayout();
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
    updateDoorPanelLayout();
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
    showStep(3);
  });
}

if (step3BackBtn) {
  step3BackBtn.addEventListener('click', () => {
    showStep(2);
  });
}

if (step3NextBtn) {
  step3NextBtn.addEventListener('click', () => {
    console.log('Stap 3 bevestigd');
  });
}

if (frontView2d) {
  applyFrontViewZoom(1);
  frontView2d.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    applyFrontViewZoom(frontViewZoomState.value + delta);
  }, { passive: false });
}

if (zoomInBtn) {
  zoomInBtn.addEventListener('click', () => {
    applyFrontViewZoom(frontViewZoomState.value + 0.1);
  });
}

if (zoomOutBtn) {
  zoomOutBtn.addEventListener('click', () => {
    applyFrontViewZoom(frontViewZoomState.value - 0.1);
  });
}

if (addComponentBtn && componentMenu) {
  const closeAllComponentGroups = () => {
    componentMenu.querySelectorAll('.component-submenu').forEach((submenu) => {
      submenu.hidden = true;
      submenu.classList.remove('is-open');
    });
    componentMenu.querySelectorAll('.component-group-btn .chevron').forEach((icon) => {
      (icon as HTMLElement).style.transform = 'rotate(0deg)';
    });
  };

  const positionComponentMenu = () => {
    const btnRect = addComponentBtn.getBoundingClientRect();
    const menuWidth = componentMenu.offsetWidth || 220;
    const menuHeight = componentMenu.offsetHeight || 240;
    const left = Math.min(Math.max(12, btnRect.right - menuWidth), window.innerWidth - menuWidth - 12);
    const top = Math.min(Math.max(12, btnRect.bottom + 10), window.innerHeight - menuHeight - 12);

    componentMenu.style.left = `${left}px`;
    componentMenu.style.top = `${top}px`;
    componentMenu.style.right = 'auto';
  };

  addComponentBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    componentMenu.hidden = !componentMenu.hidden;
    if (!componentMenu.hidden) {
      positionComponentMenu();
    } else {
      closeAllComponentGroups();
    }
  });

  window.addEventListener('resize', () => {
    if (!componentMenu.hidden) positionComponentMenu();
  });

  document.addEventListener('click', (event) => {
    if (!componentMenu.hidden && !componentMenu.contains(event.target as Node) && !addComponentBtn.contains(event.target as Node)) {
      componentMenu.hidden = true;
      closeAllComponentGroups();
    }
  });

  componentMenu.querySelectorAll('.component-group-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const group = button.parentElement?.querySelector('.component-submenu') as HTMLDivElement | null;
      const chevron = button.querySelector('.chevron') as HTMLElement | null;
      if (!group || !chevron) return;

      const isOpen = !group.hidden;
      closeAllComponentGroups();

      if (!isOpen) {
        group.hidden = false;
        group.classList.add('is-open');
        chevron.style.transform = 'rotate(90deg)';
      }
    });
  });

  componentMenu.querySelectorAll('.component-option').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if ((button as HTMLButtonElement).disabled) return;
      const itemId = (button as HTMLButtonElement).dataset.component || 'hoofdschakelaar';
      const item = componentCatalog.find((entry) => entry.id === itemId) || componentCatalog[0];
      addComponentToScene(item, 0.5, 0.5);
      componentMenu.hidden = true;
      closeAllComponentGroups();
    });
  });
}

// initial model
const initialFile = (kast1 && kast1.dataset.model) ? kast1.dataset.model : 'kast.gltf';
loadModelFile(initialFile);
setActiveButton(kast1);
showStep(1);

if (rightDoor) {
  setActiveDoorButton(rightDoor);
  configuratorState.selectedDoor = {
    id: rightDoor.id,
    name: rightDoor.textContent?.trim() || 'Deur rechts',
    modelFile: rightDoor.dataset.door || 'door2.gltf',
  };
  applyDoorOrientation(false);
updateDoorPanelLayout();
}

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
  updateFrontPreview();
}


animate();
