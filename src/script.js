import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'

import * as dev from './dev.js'
import SmokeParticle from './Effects/Smoke-Puff/SmokeParticle'
import SmokeCoffee from './Effects/Smoke-Coffee/Smoke-Coffee.js'
import Flame from './Effects/Flame/Flame.js'
import HologramMaterial from './Effects/Hologram/HologramMaterial.js'
import RainbowBubble from './Effects/RainbowBubble/RainbowBubble.js'
import Fire from './Effects/Fire/Fire.js'
import jumpingOutHeart from './Effects/JumpingOutHeart/JumpingOutHeart.js'
import PoppingHeart from './Effects/PoppingHeart/PoppingHeart.js'
import PoppingCharas from './Effects/PoppingCharas/PoppingCharas.js'
import Confetti from './Effects/Confetti/Confetti.js'
import RoundingCharas from './Effects/RoundingCharas/RoundingCharas.js'
import SpreadingCharas from './Effects/SpreadingCharas/SpreadingCharas.js'

import particleVertexShader from './Effects/GPGPU/shaders/particles/vertex.glsl'
import particleFragmentShader from './Effects/GPGPU/shaders/particles/fragment.glsl'
import gpgpuParticleShader from './Effects/GPGPU/shaders/gpgpu/particles.glsl'

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
}
sizes.resolution = new THREE.Vector2(sizes.width, sizes.height)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // for GPGPU particles
    // Materials
    if (particles.material) {
        particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
    }
    
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    
    sizes.resolution.set(sizes.width, sizes.height)
    items.smokePuff.resize(sizes.resolution)
    items.flame.resize(sizes.resolution)
})

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 9
camera.position.y = 8
camera.position.z = 20
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

// Loaders
const textureLoader = new THREE.TextureLoader()

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/ship-draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)


/**
 * Mesh
 */
const items = {}
dev.devSetup(camera, canvas)
const pane = dev.getPane()

/**
 * Test Mesh
 */
const shape = new THREE.Shape()
const x = 0
const y = 0
const halfWidth = 0.5
const height = 2
const curveRadius = halfWidth * 2 * 0.1

shape.moveTo(x + halfWidth - curveRadius, y)
shape.bezierCurveTo(
    x + halfWidth - curveRadius, y,
    x + halfWidth, y,
    x + halfWidth, y + curveRadius
)
shape.lineTo(x + halfWidth, y + height - curveRadius)
shape.bezierCurveTo(
    x + halfWidth, y + height - curveRadius,
    x + halfWidth, y + height,
    x + halfWidth - curveRadius, y + height
)
shape.lineTo(x - halfWidth + curveRadius, y + height)
shape.bezierCurveTo(
    x - halfWidth + curveRadius, y + height,
    x - halfWidth, y + height,
    x - halfWidth, y + height - curveRadius
)
shape.lineTo(x - halfWidth, y + curveRadius)
shape.bezierCurveTo(
    x - halfWidth, y + curveRadius,
    x - halfWidth, y,
    x - halfWidth + curveRadius, y
)

const roundedSquare = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)
roundedSquare.position.set(0, 5, 0)
scene.add(roundedSquare)


/**
 * Load model
 */
const gltf = await gltfLoader.loadAsync('./ship-model.glb')

/**
 * BaseGeometry
 */
const baseGeometry = {}
baseGeometry.instance = gltf.scene.children[0].geometry
baseGeometry.count = baseGeometry.instance.attributes.position.count

/**
 * GPU Compute
 */
const gpgpu = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

// Base Particles
const baseParticleTexture = gpgpu.computation.createTexture()
for (let i = 0; i < baseGeometry.count; i++) {
    const i3 = i * 3
    const i4 = i * 4

    // position baset on geometry
    baseParticleTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
    baseParticleTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
    baseParticleTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
    baseParticleTexture.image.data[i4 + 3] = Math.random()
}

// Particles variable
gpgpu.particleVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticleShader, baseParticleTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particleVariable, [gpgpu.particleVariable])

// Uniforms
gpgpu.particleVariable.material.uniforms.uTime = { value: 0 }
gpgpu.particleVariable.material.uniforms.uBase = { value: baseParticleTexture }
gpgpu.particleVariable.material.uniforms.uDeltaTime = { value: 0 }
gpgpu.particleVariable.material.uniforms.uFlowFieldInfluence = { value: 0.5 }
gpgpu.particleVariable.material.uniforms.uFlowFieldStrength = { value: 2 }
gpgpu.particleVariable.material.uniforms.uFlowFieldFrequency = { value: 0.5 }

// Init
gpgpu.computation.init()

// Debug GPGPU
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({ map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture })
)
gpgpu.debug.position.set(4, 0, 6)
scene.add(gpgpu.debug)

const particles = {}
// Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2)
const sizesArray = new Float32Array(baseGeometry.count)

for (let y = 0; y < gpgpu.size; y++) {
    for (let x = 0; x < gpgpu.size; x++) {
        const i = y * gpgpu.size + x
        const i2 = i * 2

        // particles uv
        const uvX = (x + 0.5) / gpgpu.size
        const uvY = (y + 0.5) / gpgpu.size

        particlesUvArray[i2 + 0] = uvX
        particlesUvArray[i2 + 1] = uvY

        // sizes
        sizesArray[i] = Math.random()
    }
}

particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color)
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))

// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    uniforms: {
        uTexture : { value: textureLoader.load('./circle_05.png') },
        uSize: { value: 0.04 },
        uResolution: { value: new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio) },
        uParticlesTexture: new THREE.Uniform(),
    },
})

particles.points = new THREE.Points(particles.geometry, particles.material)
particles.points.position.set(-7.6, 0, -5)
scene.add(particles.points)

const GPUFolder = pane.addFolder({ title: 'GPGPU Particles', expanded: false, index: 0 })
GPUFolder.addBinding(particles.material.uniforms.uSize, 'value', { label: 'Size', min: 0.01, max: 1, step: 0.01})
GPUFolder.addBinding(gpgpu.particleVariable.material.uniforms.uFlowFieldInfluence, 'value', { label: 'Flow Field Influence', min: 0, max: 1, step: 0.01})
GPUFolder.addBinding(gpgpu.particleVariable.material.uniforms.uFlowFieldStrength, 'value', { label: 'Flow Field Strength', min: 0, max: 10, step: 0.1})
GPUFolder.addBinding(gpgpu.particleVariable.material.uniforms.uFlowFieldFrequency, 'value', { label: 'Flow Field Frequency', min: 0, max: 1, step: 0.001})


// smokePuff
items.smokePuff = new SmokeParticle({
        parent: scene,
        position: new THREE.Vector3(-3, 2, 0),
        pixelRatio: sizes.pixelRatio,
        resolution: sizes.resolution,
        gui: pane.addFolder({ title: 'Smoke Puff', expanded: false, index: 10 })
    },
)

// smokeCoffee
items.smokeCoffee = new SmokeCoffee({
        parent: scene,
        position: new THREE.Vector3(0, 1.83, 0),
        gui: pane.addFolder({ title: 'Smoke Coffee', expanded: false, index: 11 })
    },
)

// fire
items.fire = new Fire({
        parent: scene,
        pixelRatio: sizes.pixelRatio,
        resolution: sizes.resolution,
        position: new THREE.Vector3(3, 1, 3),
        gui: pane.addFolder({ title: 'Fire', expanded: false, index: 12 })
    },
)

//flame
items.flame = new Flame({
        parent: scene,
        position: new THREE.Vector3(-3, 0.2, 5),
        pixelRatio: sizes.pixelRatio,
        resolution: sizes.resolution,
        gui: pane.addFolder({ title: 'Flame', expanded: false, index: 13 })
    },
)

// Hologram Material & Rainbow Bubble
const hologramMaterial = new HologramMaterial({ gui: pane.addFolder({ title: 'Hologram Material', expanded: false, index: 14 }) })
// Suzanne
let suzanne = null
let suzanneRainbowBubble
gltfLoader.load('./suzanne.glb', (gltf) => {
        suzanne = gltf.scene
        suzanne.traverse((child) => {
            if(child.isMesh)
                child.material = hologramMaterial.material
        })
        suzanne.position.set(0, 2, 2)
        suzanne.scale.setScalar(0.7)
        scene.add(suzanne)

        suzanneRainbowBubble = new RainbowBubble({ 
            parent: suzanne, 
            gui: pane.addFolder({ title: 'Rainbow Bubble', expanded: false, index: 15 })
        })
    }
)

// Jumping Out Heart
items.jumpingOutHeart = new jumpingOutHeart({
    parent: scene,
    position: new THREE.Vector3(0, 4, 0),
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    gui: pane.addFolder({ title: 'Jumping Out Heart', expanded: false, index: 21 })
})

// Popping Heart
items.poppingHeart = new PoppingHeart({
    parent: scene,
    position: new THREE.Vector3(0, 2, 0),
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    gui: pane.addFolder({ title: 'Popping Heart', expanded: false, index: 16 })
})

// Popping Charas
items.poppingCharas = new PoppingCharas({
    parent: scene,
    position: new THREE.Vector3(-1, 3, 5),
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    gui: pane.addFolder({ title: 'Popping Charas', expanded: false, index: 20 })
})

// Confetti
items.confetti = new Confetti({ 
    parent: scene,
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    gui: pane.addFolder({ title: 'Confetti', expanded: false, index: 17 }) 
})

// Rounding Charas
items.roundingCharas = new RoundingCharas({
    parent: scene,
    position: new THREE.Vector3(2.5, 4, 5),
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    size: 10,
    radius: 10,
    gui: pane.addFolder({ title: 'Rounding Charas', expanded: false, index: 18 })
})

// Spreading Charas
items.spreadingCharas = new SpreadingCharas({
    parent: scene,
    position: new THREE.Vector3(0, 2, 5),
    pixelRatio: sizes.pixelRatio,
    resolution: sizes.resolution,
    spreadRate: 0.5,
    size: 10,
    radius: 10,
    gui: pane.addFolder({ title: 'Spreading Charas', expanded: false, index: 19 })
})

/**
 * Model
 */
gltfLoader.load('./bakedModel.glb', (gltf) =>
    {
        gltf.scene.getObjectByName('baked').material.map.anisotropy = 8
        scene.add(gltf.scene)
    }
)

/**
 * Animate
 */
const clock = new THREE.Clock()

let delta = 0
let elapsed = 0
let currentTime = 0

const render = () =>
{
    elapsed = clock.getElapsedTime()
    delta = elapsed - currentTime
    currentTime = elapsed

    // Update smokePuff
    items.smokePuff.update(delta)
    // Update smokeCoffee
    items.smokeCoffee.update(delta)
    // update fire
    items.fire.update(delta)
    // Update flame
    items.flame.update(delta)
    // Update hologramMaterial
    hologramMaterial.material.uniforms.uTime.value = elapsed
    // Update JumpingOutHeart
    items.jumpingOutHeart.update(delta)
    // Update poppingHeart
    items.poppingHeart.update(delta)
    // Update confetti
    items.confetti.update(delta)
    // Update roundingCharas
    items.roundingCharas.update(delta)
    // Update poppingCharas
    items.poppingCharas.update(delta)
    // Update spreadingCharas
    items.spreadingCharas.update(delta)
    
    
    // Rotate objects
    if(suzanne) {
        // suzanne.rotation.x = - elapsed * 0.1
        // suzanne.rotation.y = elapsed * 0.2
        // Update rainbowBubble
        if (suzanneRainbowBubble && suzanneRainbowBubble.state === 'on') {
            // suzanne.position.x = Math.cos(elapsed * 0.6) * 5
            // suzanne.position.y = Math.sin(elapsed * 1.4) * 2 + 2
            // suzanne.position.z = Math.cos(elapsed * 0.2) * 3 - 2
        }
        suzanneRainbowBubble.update(delta)
    }

    // Update controls
    dev.render()

    // GPGPU Update
    gpgpu.particleVariable.material.uniforms.uTime.value = elapsed
    gpgpu.particleVariable.material.uniforms.uDeltaTime.value = delta
    gpgpu.computation.compute()
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(render)
}

render()

const toggleListBtn = document.getElementById('toggle-links')
const list = document.getElementById('list-links')
const toggleListText = document.querySelector('#toggle-links>h1')

toggleListBtn.addEventListener('click', () => {
    list.classList.toggle('show')
    if (list.classList.contains('show')) {
        toggleListText.textContent = '×'
    } else {
        toggleListText.textContent = 'Next'
    }
})