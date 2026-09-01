import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cabinetCatalog } from './cabinetCatalog';

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
  if (!document.body.contains(status)) stage!.appendChild(status);
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

type ConfiguratorStep = 1 | 2 | 3 | 4 | 5 | 6;
type ComponentView = 'front' | 'bottom' | 'left' | 'right' | 'mountingPlate';

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
  placement: ComponentPlacement;
}

interface ComponentPlacement {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: [number, number, number];
  scale: number;
}

interface MountedComponent {
  id: string;
  name: string;
  itemId: string;
  x: number;
  y: number;
  placement: ComponentPlacement;
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
  {
    id: 'hoofdschakelaar',
    name: 'Hoofdschakelaar',
    file: 'hoofdschakelaar.gltf',
    placement: {
      position: { x: 0.5, y: 0.5, z: -0.47 },
      rotation: [3.13, Math.PI, 0],
      scale: 1,
    },
  },
  {
    id: 'zekering',
    name: 'Zekering',
    placement: {
      position: { x: 0.5, y: 0.5, z: 0 },
      rotation: [0, 0, 0],
      scale: 0.25,
    },
  },
  {
    id: 'drukschakelaar',
    name: 'Drukschakelaar',
    placement: {
      position: { x: 0.5, y: 0.5, z: 0 },
      rotation: [0, 0, 0],
      scale: 0.25,
    },
  },
  {
    id: 'signaallampje',
    name: 'Signaallampje',
    file: 'signaallamp_groen.gltf',
    placement: {
      position: { x: 0.64, y: 0.51, z: -0.08 },
      rotation: [1.57, 0, 0],
      scale: 1,
    },
  },
];

const glandCatalog: ComponentCatalogItem[] = [
  {
    id: 'wartel',
    name: 'Wartel',
    placement: {
      position: { x: 0.5, y: 0.5, z: 0 },
      rotation: [0, 0, 0],
      scale: 0.25,
    },
  },
];

const sideComponentCatalog: ComponentCatalogItem[] = [
  {
    id: 'verwarming',
    name: 'Verwarmingsmodel',
    placement: { position: { x: 0.5, y: 0.5, z: 0 }, rotation: [0, 0, 0], scale: 0.25 },
  },
  {
    id: 'ventilatie',
    name: 'Ventilatiemodel',
    placement: { position: { x: 0.5, y: 0.5, z: 0 }, rotation: [0, 0, 0], scale: 0.25 },
  },
];

const mountingPlateComponentCatalog: ComponentCatalogItem[] = [
  {
    id: 'din-rail',
    name: 'DIN-rail',
    placement: { position: { x: 0.5, y: 0.35, z: 0 }, rotation: [0, 0, 0], scale: 0.25 },
  },
  {
    id: 'kabelgoot',
    name: 'Kabelgoot',
    placement: { position: { x: 0.5, y: 0.65, z: 0 }, rotation: [0, 0, 0], scale: 0.25 },
  },
];

const mountedComponents: MountedComponent[] = [];
const mountedGlands: MountedComponent[] = [];
const mountedLeftSideComponents: MountedComponent[] = [];
const mountedRightSideComponents: MountedComponent[] = [];
let selectedComponent: MountedComponent | null = null;
let componentLayout: HTMLDivElement | null = null;
let componentView: ComponentView = 'front';
let doorOpenDirection = 1;
let doorAnimationFrame: number | null = null;
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
const cabinetList = document.getElementById('cabinet-list') as HTMLDivElement | null;
const selectedNameEl = document.getElementById('selected-name');
const selectedDoorNameEl = document.getElementById('selected-door-name');
const selectedComponentNameEl = document.getElementById('selected-component-name');
const selectedGlandNameEl = document.getElementById('selected-gland-name');
const selectedSideLeftNameEl = document.getElementById('selected-side-left-name');
const selectedSideRightNameEl = document.getElementById('selected-side-right-name');
const deleteComponentBtn = document.getElementById('delete-component-btn') as HTMLButtonElement | null;
const step1NextBtn = document.getElementById('step1-next-btn') as HTMLButtonElement | null;
const step2NextBtn = document.getElementById('step2-next-btn') as HTMLButtonElement | null;
const step3BackBtn = document.getElementById('step3-back-btn') as HTMLButtonElement | null;
const step3NextBtn = document.getElementById('step3-next-btn') as HTMLButtonElement | null;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement | null;
const configStep1 = document.getElementById('config-step-1') as HTMLElement | null;
const configStep2 = document.getElementById('config-step-2') as HTMLElement | null;
const configStep3 = document.getElementById('config-step-3') as HTMLElement | null;
const configStep4 = document.getElementById('config-step-4') as HTMLElement | null;
const step4ComponentHost = document.getElementById('step4-component-host') as HTMLDivElement | null;
const configStep5 = document.getElementById('config-step-5') as HTMLElement | null;
const configStep6 = document.getElementById('config-step-6') as HTMLElement | null;
const step5ComponentHost = document.getElementById('step5-component-host') as HTMLDivElement | null;
const step6ComponentHost = document.getElementById('step6-component-host') as HTMLDivElement | null;
const addComponentBtn = document.getElementById('add-component-btn') as HTMLButtonElement | null;
const zoomInBtn = document.querySelector('.zoom-in') as HTMLButtonElement | null;
const zoomOutBtn = document.querySelector('.zoom-out') as HTMLButtonElement | null;
const componentMenu = document.getElementById('component-menu') as HTMLDivElement | null;
const componentLayer = document.getElementById('component-layer') as HTMLDivElement | null;
const doorPanel = document.getElementById('door-panel') as HTMLDivElement | null;
componentLayout = document.querySelector('.component-layout') as HTMLDivElement | null;
const step3Footer = configStep3?.querySelector('.panel-footer') || null;

function getMountedComponents() {
  if (configuratorState.currentStep === 4) return mountedGlands;
  if (configuratorState.currentStep === 5) return mountedLeftSideComponents;
  if (configuratorState.currentStep === 6) return mountedRightSideComponents;
  return mountedComponents;
}

function getAllMountedComponents() {
  return [
    ...mountedComponents,
    ...mountedGlands,
    ...mountedLeftSideComponents,
    ...mountedRightSideComponents,
  ];
}

function getSelectedNameEl() {
  if (configuratorState.currentStep === 4) return selectedGlandNameEl;
  if (configuratorState.currentStep === 5) return selectedSideLeftNameEl;
  if (configuratorState.currentStep === 6) return selectedSideRightNameEl;
  return selectedComponentNameEl;
}

function updateComponentMenuForStep() {
  if (!componentMenu) return;
  componentMenu.querySelectorAll<HTMLElement>('.component-group').forEach((group) => {
    const isStep3 = configuratorState.currentStep === 3;
    const isStep4 = configuratorState.currentStep === 4;
    const isSideView = configuratorState.currentStep === 5;
    const isMountingPlateView = configuratorState.currentStep === 6;
    group.hidden = group.hasAttribute('data-step4-only') ? !isStep4
      : group.hasAttribute('data-side-view-only') ? !isSideView
      : group.hasAttribute('data-mounting-plate-only') ? !isMountingPlateView
      : !isStep3;
  });
}

function renderActiveComponents() {
  const activeComponents = getMountedComponents();
  getAllMountedComponents().forEach((component) => {
    if (component.marker) component.marker.remove();
  });
  activeComponents.forEach((component) => {
    if (component.marker && componentLayer) componentLayer.appendChild(component.marker);
  });
}

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
  if (configStep4) configStep4.hidden = step !== 4;
  if (configStep5) configStep5.hidden = step !== 5;
  if (configStep6) configStep6.hidden = step !== 6;
  if (componentLayout && step4ComponentHost && step5ComponentHost && step6ComponentHost) {
    if (step === 4) step4ComponentHost.appendChild(componentLayout);
    else if (step === 5) step5ComponentHost.appendChild(componentLayout);
    else if (step === 6) step6ComponentHost.appendChild(componentLayout);
    else if (configStep3 && step3Footer) configStep3.insertBefore(componentLayout, step3Footer);
  }
  componentView = step === 4 ? 'bottom' : step === 5 ? 'left' : step === 6 ? 'mountingPlate' : 'front';
  if (componentMenu) componentMenu.hidden = true;
  updateComponentMenuForStep();
  selectedComponent = null;
  if (deleteComponentBtn) deleteComponentBtn.disabled = true;
  const selectedName = getSelectedNameEl();
  if (selectedName) selectedName.textContent = step === 4 ? 'Geen wartel' : 'Geen onderdeel';
  renderActiveComponents();
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
  doorOpenDirection = isLeftHinge ? -1 : 1;
  const pivot = currentModel.getObjectByName('DOOR_PIVOT');
  if (pivot) pivot.rotation.y = 0;
  updateDoorPanelLayout();
  updateFrontPreview();
}

function animateDoorOpen() {
  if (!currentModel) return;
  const pivot = currentModel.getObjectByName('DOOR_PIVOT');
  if (!pivot) return;
  if (doorAnimationFrame) cancelAnimationFrame(doorAnimationFrame);

  const start = performance.now();
  const duration = 900;
  const startAngle = pivot.rotation.y;
  const targetAngle = THREE.MathUtils.degToRad(110) * doorOpenDirection;
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    pivot.rotation.y = THREE.MathUtils.lerp(startAngle, targetAngle, eased);
    updateFrontPreview();
    if (progress < 1) doorAnimationFrame = requestAnimationFrame(tick);
    else doorAnimationFrame = null;
  };
  doorAnimationFrame = requestAnimationFrame(tick);
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
  const visibleComponentIds = new Set(getMountedComponents().map((component) => component.id));
  if (componentView === 'mountingPlate') {
    cloned.traverse((object) => { object.visible = false; });
    const plate = cloned.getObjectByName('MOUNTING_PLATE');
    if (plate) {
      plate.traverse((object) => { object.visible = true; });
      let parent: THREE.Object3D | null = plate.parent;
      while (parent) {
        parent.visible = true;
        if (parent === cloned) break;
        parent = parent.parent;
      }
    }
    cloned.traverse((object) => {
      const componentId = object.userData.mountedComponentId as string | undefined;
      if (componentId && visibleComponentIds.has(componentId)) {
        object.traverse((child) => { child.visible = true; });
      }
    });
  } else {
    cloned.traverse((object) => {
      const componentId = object.userData.mountedComponentId as string | undefined;
      if (componentId) object.visible = visibleComponentIds.has(componentId);
    });
  }

  const box = new THREE.Box3().setFromObject(cloned);
  const center = box.getCenter(new THREE.Vector3());
  cloned.position.sub(center);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = Math.max(2.2, maxDim * 2.2);
  if (componentView === 'bottom') {
    frontPreviewCamera.position.set(0, -distance, 0);
    frontPreviewCamera.up.set(0, 0, 1);
  } else if (componentView === 'left' || componentView === 'right') {
    frontPreviewCamera.position.set(componentView === 'left' ? -distance : distance, 0, 0);
    frontPreviewCamera.up.set(0, 1, 0);
  } else {
    frontPreviewCamera.position.set(0, 0, distance);
    frontPreviewCamera.up.set(0, 1, 0);
  }
  frontPreviewCamera.lookAt(0, 0, 0);
  frontPreviewCamera.aspect = width / height;
  frontPreviewCamera.updateProjectionMatrix();

  frontPreviewScene.add(cloned);
  cloned.updateMatrixWorld(true);

  const componentWorldPosition = new THREE.Vector3();
  const componentBounds = new THREE.Box3();
  const projectedPosition = new THREE.Vector3();
  getMountedComponents().forEach((component) => {
    if (!component.mesh || !component.marker) return;

    componentBounds.setFromObject(component.mesh);
    componentBounds.getCenter(componentWorldPosition);
    const clonedPosition = cloned.worldToLocal(componentWorldPosition.clone());
    cloned.localToWorld(clonedPosition);
    projectedPosition.copy(clonedPosition).project(frontPreviewCamera);

    component.marker.style.left = `${(projectedPosition.x + 1) * 50}%`;
    component.marker.style.top = `${(1 - projectedPosition.y) * 50}%`;
  });

  frontPreviewRenderer.render(frontPreviewScene, frontPreviewCamera);
}

function clearMountedComponents() {
  [...mountedComponents, ...mountedGlands].forEach((item) => {
    if (item.mesh && item.mesh.parent) item.mesh.parent.remove(item.mesh);
    if (item.marker && item.marker.parentNode) item.marker.parentNode.removeChild(item.marker);
  });
  mountedComponents.length = 0;
  mountedGlands.length = 0;
  mountedLeftSideComponents.length = 0;
  mountedRightSideComponents.length = 0;
  selectedComponent = null;
  if (deleteComponentBtn) deleteComponentBtn.disabled = true;
  if (selectedComponentNameEl) selectedComponentNameEl.textContent = 'Geen onderdeel';
  if (selectedGlandNameEl) selectedGlandNameEl.textContent = 'Geen wartel';
}

function selectComponent(component: MountedComponent) {
  selectedComponent = component;
  getMountedComponents().forEach((entry) => entry.marker?.classList.toggle('is-selected', entry === component));
  if (deleteComponentBtn) deleteComponentBtn.disabled = false;
  setComponentSelectionLabel(component.name);
}

function deleteSelectedComponent() {
  if (!selectedComponent) return;

  const activeComponents = getMountedComponents();
  const componentIndex = activeComponents.indexOf(selectedComponent);
  if (componentIndex === -1) return;

  const component = activeComponents[componentIndex];
  if (component.mesh?.parent) component.mesh.parent.remove(component.mesh);
  if (component.marker?.parentNode) component.marker.parentNode.removeChild(component.marker);
  activeComponents.splice(componentIndex, 1);
  selectedComponent = null;
  if (deleteComponentBtn) deleteComponentBtn.disabled = true;
  const selectedName = getSelectedNameEl();
  if (selectedName) selectedName.textContent = configuratorState.currentStep === 4 ? 'Geen wartel' : 'Geen onderdeel';
  updateFrontPreview();
}

function convert2DTo3D(x: number, y: number, depthOffset = 0) {
  if (!currentModel) {
    return new THREE.Vector3(0, 0, 0.15);
  }

  const box = new THREE.Box3().setFromObject(currentModel);
  const size = box.getSize(new THREE.Vector3());
  if (componentView === 'mountingPlate') {
    const plate = currentModel.getObjectByName('MOUNTING_PLATE');
    if (plate) {
      const plateBox = new THREE.Box3().setFromObject(plate);
      const plateSize = plateBox.getSize(new THREE.Vector3());
      const platePosition = new THREE.Vector3(
        THREE.MathUtils.lerp(plateBox.min.x, plateBox.max.x, x),
        THREE.MathUtils.lerp(plateBox.max.y, plateBox.min.y, y),
        plateBox.max.z + plateSize.z * (0.5 + depthOffset)
      );
      currentModel.updateMatrixWorld(true);
      return currentModel.worldToLocal(platePosition);
    }
  }
  const targetX = THREE.MathUtils.lerp(-size.x * 0.28, size.x * 0.28, x);
  const targetY = THREE.MathUtils.lerp(size.y * 0.28, -size.y * 0.28, y);
  const targetWorldPosition = componentView === 'bottom'
    ? new THREE.Vector3(targetX, -size.y * 0.5 - size.y * depthOffset, THREE.MathUtils.lerp(size.z * 0.35, -size.z * 0.35, y))
    : componentView === 'left' || componentView === 'right'
      ? new THREE.Vector3(
        (componentView === 'left' ? -1 : 1) * (size.x * 0.5 + size.x * depthOffset),
        targetY,
        THREE.MathUtils.lerp(-size.z * 0.35, size.z * 0.35, x)
      )
      : new THREE.Vector3(targetX, targetY, size.z * 0.56 + size.z * depthOffset);
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
    component.mesh.position.copy(convert2DTo3D(component.x, component.y, component.placement.position.z));
  }
  updateFrontPreview();
}

function setComponentSelectionLabel(name: string) {
  const selectedName = getSelectedNameEl();
  if (selectedName) selectedName.textContent = name;
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
    const dragComponent = getMountedComponents().find((entry) => entry.id === component.id);
    if (!dragComponent || !componentLayer) return;

    selectComponent(dragComponent);
    const startX = dragComponent.x;
    const startY = dragComponent.y;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    marker.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const rect = componentLayer.getBoundingClientRect();
      const deltaX = (moveEvent.clientX - startClientX) / rect.width;
      const deltaY = (moveEvent.clientY - startClientY) / rect.height;
      dragComponent.x = Math.min(Math.max(startX + deltaX, 0.08), 0.92);
      dragComponent.y = Math.min(Math.max(startY + deltaY, 0.08), 0.92);
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

function addComponentToScene(
  item: ComponentCatalogItem,
  x = item.placement.position.x,
  y = item.placement.position.y
) {
  const componentId = `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const component: MountedComponent = {
    id: componentId,
    name: item.name,
    itemId: item.id,
    x,
    y,
    placement: item.placement,
    mesh: null,
    marker: null,
  };

  getMountedComponents().push(component);
  createComponentMarker(item, component);
  syncComponentPosition(component);
  selectComponent(component);

  const attachMesh = (mesh: THREE.Object3D) => {
    if (!currentModel || !getMountedComponents().includes(component)) return;
    mesh.position.copy(convert2DTo3D(component.x, component.y, component.placement.position.z));
    mesh.rotation.set(...component.placement.rotation);
    mesh.scale.setScalar(component.placement.scale);
    mesh.userData.mountedComponentId = component.id;
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

if (deleteComponentBtn) {
  deleteComponentBtn.addEventListener('click', deleteSelectedComponent);
}

function createCabinetButtons() {
  if (!cabinetList) return;

  cabinetCatalog.forEach((cabinet, index) => {
    const button = document.createElement('button');
    button.id = `cabinet-${cabinet.id}`;
    button.className = 'model-btn';
    button.dataset.model = cabinet.modelFile;
    button.setAttribute('role', 'listitem');
    button.textContent = cabinet.name;
    button.addEventListener('click', () => {
      clearMountedComponents();
      loadModelFile(cabinet.modelFile);
      configuratorState.selectedCabinet = cabinet;
      setActiveButton(button);
    });
    cabinetList.appendChild(button);

    if (index === 0) {
      button.classList.add('active');
      configuratorState.selectedCabinet = cabinet;
    }
  });
}

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
    showStep(4);
  });
}

const step4BackBtn = document.getElementById('step4-back-btn') as HTMLButtonElement | null;
const step4NextBtn = document.getElementById('step4-next-btn') as HTMLButtonElement | null;
if (step4BackBtn) step4BackBtn.addEventListener('click', () => showStep(3));
if (step4NextBtn) step4NextBtn.addEventListener('click', () => showStep(5));

const step5BackBtn = document.getElementById('step5-back-btn') as HTMLButtonElement | null;
const step5NextBtn = document.getElementById('step5-next-btn') as HTMLButtonElement | null;
const step6BackBtn = document.getElementById('step6-back-btn') as HTMLButtonElement | null;
const step6NextBtn = document.getElementById('step6-next-btn') as HTMLButtonElement | null;
if (step5BackBtn) step5BackBtn.addEventListener('click', () => showStep(4));
if (step5NextBtn) step5NextBtn.addEventListener('click', () => showStep(6));
if (step6BackBtn) step6BackBtn.addEventListener('click', () => showStep(5));
if (step6NextBtn) step6NextBtn.addEventListener('click', animateDoorOpen);

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
    componentMenu.querySelectorAll<HTMLDivElement>('.component-submenu').forEach((submenu) => {
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
      const catalog = configuratorState.currentStep === 4 ? glandCatalog
        : configuratorState.currentStep === 5
          ? sideComponentCatalog
          : configuratorState.currentStep === 6
            ? mountingPlateComponentCatalog
            : componentCatalog;
      const itemId = (button as HTMLButtonElement).dataset.component || catalog[0].id;
      const item = catalog.find((entry) => entry.id === itemId) || catalog[0];
      addComponentToScene(item);
      componentMenu.hidden = true;
      closeAllComponentGroups();
    });
  });
}

// initial model
createCabinetButtons();
const initialCabinet = cabinetCatalog[0];
const initialFile = initialCabinet?.modelFile || 'kast.gltf';
loadModelFile(initialFile);
if (cabinetList?.firstElementChild) setActiveButton(cabinetList.firstElementChild);
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
