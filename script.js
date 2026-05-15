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
scene.fog = new THREE.Fog(0x050816, 6, 28);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 7.2);
scene.add(camera);

scene.add(new THREE.HemisphereLight(0x9adfff, 0x1c1038, 1.25));
const key = new THREE.DirectionalLight(0x64eaff, 2);
key.position.set(5, 5, 4);
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: 0x050816,
    metalness: 0.8,
    roughness: 0.35,
    emissive: 0x0b173b,
    emissiveIntensity: 0.25
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.2;
scene.add(floor);

const carGroup = new THREE.Group();
scene.add(carGroup);

function normalizeModel(model, target = 3.8) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  model.scale.setScalar(target / maxDim);
}

function createFallbackCar() {
  const geom = new THREE.BoxGeometry(2.6, 0.8, 1.2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a3c7a,
    emissive: 0x2f7fff,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.2
  });
  const box = new THREE.Mesh(geom, mat);
  carGroup.add(box);
}

function setupScrollAnimation() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1
    }
  });

  tl.to(carGroup.position, { x: -1.1, z: -0.8, duration: 1 }, 0)
    .to(carGroup.rotation, { y: Math.PI * 0.28, duration: 1 }, 0)
    .to(camera.position, { z: 5.8, x: 0.5, duration: 1 }, 0)
    .to(".hero-content", { y: -120, opacity: 0.25, duration: 1 }, 0)
    .to(carGroup.position, { x: 1.8, z: -2.0, y: -0.1, duration: 1.2 }, 1)
    .to(carGroup.rotation, { y: -Math.PI * 0.35, duration: 1.2 }, 1)
    .to(camera.position, { x: -0.7, y: 1.4, z: 4.8, duration: 1.2 }, 1);
}

const gltfLoader = new GLTFLoader();
const MODEL_PATH = "./models/porsche_911_gt3.glb";
let loaded = false;

const failTimer = setTimeout(() => {
  if (!loaded) {
    createFallbackCar();
    setupScrollAnimation();
    loaderEl.textContent = "Model failed, fallback active ✓";
    setTimeout(() => (loaderEl.style.display = "none"), 1500);
  }
}, 7000);

gltfLoader.load(
  MODEL_PATH,
  (gltf) => {
    loaded = true;
    clearTimeout(failTimer);

    const car = gltf.scene;
    normalizeModel(car, 4.2);
    car.position.y = -0.15;
    car.rotation.y = Math.PI * 0.6;

    car.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
      }
    });

    carGroup.add(car);
    setupScrollAnimation();

    loaderEl.textContent = "Model loaded ✓";
    setTimeout(() => (loaderEl.style.display = "none"), 900);
  },
  undefined,
  (err) => {
    console.error("GLB load error:", err);
    if (!loaded) {
      clearTimeout(failTimer);
      createFallbackCar();
      setupScrollAnimation();
      loaderEl.textContent = "GLB error, fallback active ✓";
      setTimeout(() => (loaderEl.style.display = "none"), 1500);
    }
  }
);

const particles = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0x57e7ff, size: 0.03 })
);
const count = 600;
const arr = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  arr[i * 3] = (Math.random() - 0.5) * 20;
  arr[i * 3 + 1] = Math.random() * 8 - 2;
  arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
}
particles.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
scene.add(particles);

function tick() {
  const t = performance.now() * 0.001;
  particles.rotation.y = t * 0.03;
  particles.position.y = Math.sin(t * 0.5) * 0.15;
  carGroup.rotation.y += 0.0015;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
