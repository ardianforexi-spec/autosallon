import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger/+esm";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("webgl");
const loaderEl = document.getElementById("loader");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050916, 8, 34);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 1.4, 8.5);
scene.add(camera);

// Lights
const hemi = new THREE.HemisphereLight(0x8cd9ff, 0x1a0d38, 1.2);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0x67e9ff, 2.2);
keyLight.position.set(6, 6, 5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x9b5cff, 1.8, 30);
fillLight.position.set(-5, 2, -3);
scene.add(fillLight);

// Grid floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({
    color: 0x050916,
    metalness: 0.85,
    roughness: 0.35,
    emissive: 0x07102a,
    emissiveIntensity: 0.4
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.25;
scene.add(floor);

const grid = new THREE.GridHelper(80, 80, 0x2de2ff, 0x1a2d5a);
grid.position.y = -1.24;
grid.material.opacity = 0.35;
grid.material.transparent = true;
scene.add(grid);

// Futuristic rings
const ringGeo = new THREE.TorusGeometry(2.8, 0.03, 16, 120);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x4de2ff });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.position.set(0, 0.1, -1.8);
ring.rotation.x = Math.PI / 2.5;
scene.add(ring);

const ring2 = ring.clone();
ring2.scale.set(1.45, 1.45, 1.45);
ring2.material = new THREE.MeshBasicMaterial({ color: 0x9b5cff });
ring2.position.set(0, 0.25, -2.5);
scene.add(ring2);

// Particles
const particles = 900;
const pGeo = new THREE.BufferGeometry();
const arr = new Float32Array(particles * 3);

for (let i = 0; i < particles; i++) {
  arr[i * 3] = (Math.random() - 0.5) * 28;
  arr[i * 3 + 1] = Math.random() * 10 - 3;
  arr[i * 3 + 2] = (Math.random() - 0.5) * 28;
}
pGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));

const pMat = new THREE.PointsMaterial({
  color: 0x56e7ff,
  size: 0.035
});
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

const carGroup = new THREE.Group();
scene.add(carGroup);

// Auto-center + auto-scale helper
function normalizeModel(model, targetSize = 3.8) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  model.scale.setScalar(scale);
}

function createTimeline(car) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.15
    }
  });

  tl.to(carGroup.position, { x: -1.4, y: -0.1, z: -0.4, duration: 1.0 }, 0)
    .to(carGroup.rotation, { y: Math.PI * 0.24, duration: 1.0 }, 0)
    .to(camera.position, { x: 0.8, y: 1.35, z: 6.4, duration: 1.0 }, 0)
    .to(".hero-ui", { y: -120, opacity: 0.25, duration: 1.0 }, 0)

    .to(carGroup.position, { x: 1.7, y: -0.18, z: -1.7, duration: 1.2 }, 1)
    .to(carGroup.rotation, { y: -Math.PI * 0.34, duration: 1.2 }, 1)
    .to(camera.position, { x: -0.7, y: 1.55, z: 5.0, duration: 1.2 }, 1)

    .to(".fx-overlay", { opacity: 0.5, duration: 1.0 }, 1.15)
    .to(".scanlines", { opacity: 0.2, duration: 1.0 }, 1.15);
}

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "/models/porsche_911_gt3.glb",
  (gltf) => {
    const car = gltf.scene;
    normalizeModel(car, 4.2);
    car.position.y = -0.15;
    car.rotation.y = Math.PI * 0.7;

    car.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    carGroup.add(car);
    createTimeline(car);

    if (loaderEl) loaderEl.textContent = "Model loaded ✓";
    setTimeout(() => {
      if (loaderEl) loaderEl.style.display = "none";
    }, 1000);
  },
  undefined,
  (err) => {
    console.error("GLB load error:", err);
    if (loaderEl) loaderEl.textContent = "Model failed to load ✕";
  }
);

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  points.rotation.y = t * 0.03;
  points.position.y = Math.sin(t * 0.5) * 0.12;

  ring.rotation.z = t * 0.55;
  ring2.rotation.z = -t * 0.45;

  carGroup.rotation.y += 0.0018;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
