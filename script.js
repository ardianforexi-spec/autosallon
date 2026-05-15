import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger/+esm';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070b1a, 6, 20);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 7);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0x8ad8ff, 0x220c44, 1.2);
scene.add(hemi);
const rim = new THREE.DirectionalLight(0x77f0ff, 2);
rim.position.set(5, 5, 4);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: 0x070b1a,
    metalness: 0.8,
    roughness: 0.35,
    emissive: 0x0b1e4d,
    emissiveIntensity: 0.2
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.1;
scene.add(floor);

const sparks = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0x5ae2ff, size: 0.03 })
);
const particles = 700;
const pos = new Float32Array(particles * 3);
for (let i = 0; i < particles; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 20;
  pos[i * 3 + 1] = Math.random() * 8 - 2;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
}
sparks.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
scene.add(sparks);

const carGroup = new THREE.Group();
scene.add(carGroup);

const loader = new GLTFLoader();
loader.load(
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
  (gltf) => {
    const car = gltf.scene;
    car.scale.set(0.7, 0.7, 0.7);
    car.position.set(-2.2, -1, 0);
    car.rotation.y = Math.PI * 0.2;
    car.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    carGroup.add(car);
    buildTimeline(car);
  }
);

function buildTimeline(car) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2
    }
  });

  tl.to(car.position, { x: 0.5, z: -1.4, duration: 1.1 }, 0)
    .to(car.rotation, { y: -Math.PI * 0.22, duration: 1 }, 0)
    .to(camera.position, { z: 5.2, y: 1.2, duration: 1.1 }, 0)
    .to('.hero-content', { y: -120, opacity: 0.2, duration: 1 }, 0)
    .to(car.position, { x: 2.3, z: -2.8, y: -0.9, duration: 1.2 }, 1)
    .to(car.rotation, { y: -Math.PI * 0.65, duration: 1.2 }, 1)
    .to(camera.position, { x: 1.4, y: 1.5, z: 4.4, duration: 1.2 }, 1)
    .to('.overlay', { opacity: 0.4, duration: 1.2 }, 1);
}

function tick() {
  const t = performance.now() * 0.001;
  sparks.rotation.y = t * 0.03;
  sparks.position.y = Math.sin(t * 0.6) * 0.2;
  carGroup.rotation.y += 0.002;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
