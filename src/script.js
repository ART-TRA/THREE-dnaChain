import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Clock } from 'three'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import vertexShader from './shaders/water/vertex.glsl'
import particleVertexShader from './shaders/particles/vertex.glsl'
import fragmentShader from './shaders/water/fragment.glsl'
import particleFragmentShader from './shaders/particles/fragment.glsl'

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader)
let composer;
let bloomPass;
let pointsMaterial;

const params = {
  exposure: 1,
  bloomStrength: 0.3,
  bloomThreshold: 0,
  bloomRadius: 0
};

//window sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  //update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  //update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  //update renderer
  renderer.setSize(sizes.width, sizes.height)
  composer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/** Camera */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 1000)
camera.position.set(0, 1, 4)
scene.add(camera)

//controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true //плавность вращения камеры


/** Renderer */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //ограничение кол-ва рендеров в завис-ти от плотности пикселей
// renderer.setClearColor('#1f1f25', 1)
renderer.setClearColor('#020204', 1)
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;

const clock = new Clock()

const initParticles = () => {
  const particlesNumber = 100
  const particlesSpace = 3
  const particlesCoords = new Float32Array(particlesNumber * 3)
  const particlesSizes = new Float32Array(particlesNumber)
  let colorRandoms = new Float32Array(particlesNumber * 3)

  for (let i = 0; i < particlesNumber * 3; ++i) {
    particlesCoords[i] = (Math.random() - 0.5) * particlesSpace
    particlesSizes[i] = Math.random() * (0.8 - 0.3) + 0.3
    colorRandoms[i] = Math.random()
  }

   pointsMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,

    uniforms: {
      uColor1: {value: new THREE.Color(0x612574)},
      uColor2: {value: new THREE.Color(0x293583)},
      uColor3: {value: new THREE.Color(0x1954ec)},
      uTime: {value: 0}
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(particlesCoords, 3))
  geometry.setAttribute('randoms', new THREE.BufferAttribute(particlesSizes, 1))
  geometry.setAttribute('colorRandoms', new THREE.BufferAttribute(colorRandoms, 1))

  const points = new THREE.Points(geometry, pointsMaterial)
  scene.add(points)
}

gltfLoader.load('/dna.glb', (gltf) => {
  console.log(gltf.scene.children[0].geometry)
  const geometry = gltf.scene.children[0].geometry
  geometry.center()

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,

    uniforms: {
      uColor1: {value: new THREE.Color(0x612574)},
      uColor2: {value: new THREE.Color(0x293583)},
      uColor3: {value: new THREE.Color(0x1954ec)}
    }
  })
  const particlesNumber = geometry.attributes.position.array.length

  let randoms = new Float32Array(particlesNumber/3)
  let colorRandoms = new Float32Array(particlesNumber/3)

  for (let i = 0; i < particlesNumber/3; ++i) {
    //Math.random() * (max - min) + min
    randoms.set([Math.random() * (0.8 - 0.3) + 0.3], i)
    colorRandoms.set([Math.random()], i)
  }

  console.log(randoms)
  initParticles()

  geometry.setAttribute('randoms', new THREE.BufferAttribute(randoms, 1))
  geometry.setAttribute('colorRandoms', new THREE.BufferAttribute(colorRandoms, 1))

  const dna = new THREE.Points(geometry, material)
  scene.add(dna)

  const initPostprocessing = () => {
    const renderScene = new RenderPass( scene, camera );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );

    composer = new EffectComposer( renderer )
    composer.addPass( renderScene )
    composer.addPass( bloomPass )
  }
  initPostprocessing()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    dna.rotation.y = - elapsedTime * 0.06
    pointsMaterial.uniforms.uTime.value = elapsedTime

    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    //Update controls
    controls.update() //если включён Damping для камеры необходимо её обновлять в каждом кадре

    // renderer.render(scene, camera)
    composer.render()
    window.requestAnimationFrame(tick)
  }

  tick()
})


