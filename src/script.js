import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import * as dev from './dev.js'
import SmokeParticle from './Effects/Smoke-Puff/SmokeParticle'
import SmokeCoffee from './Effects/Smoke-Coffee/Smoke-Coffee.js'
import Flame from './Effects/Flame/Flame.js'
import HologramMaterial from './Effects/Hologram/HologramMaterial.js'
import RainbowBubble from './Effects/RainbowBubble/RainbowBubble.js'
import Fire from './Effects/Fire/Fire.js'
import PoppingHeart from './Effects/PoppingHeart/PoppingHeart.js'
import Confetti from './Effects/Confetti/Confetti.js'

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
sizes.resolution = new THREE.Vector2(sizes.width, sizes.height)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    sizes.resolution.set(sizes.width, sizes.height)
    items.smokePuff.resize(sizes.resolution)
    items.flame.resize(sizes.resolution)
})

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 9
camera.position.y = 8
camera.position.z = 20
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Loaders
const textureLoader = new THREE.TextureLoader()
const gltfLoader = new GLTFLoader()

/**
 * Mesh
 */
const items = {}
dev.devSetup(camera, canvas)
const pane = dev.getPane()

// smokePuff
items.smokePuff = new SmokeParticle(
    {
        scene: scene,
        position: new THREE.Vector3(-3, 1, 0),
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        size: 1,
        scale: 5,
        resolution: sizes.resolution,
    },
    pane
)

// smokeCoffee
items.smokeCoffee = new SmokeCoffee(
    {
        scene: scene,
        scale: 1,
        speed: 1,
        position: new THREE.Vector3(0, 1.83, 0),
    },
    pane
)

// fire
items.fire = new Fire(
    {
        scene: scene,
        position: new THREE.Vector3(3, 1, 3),
        resolution: sizes.resolution,
        size: 0.7,
        scale: 0.7,
    },
    pane
)

//flame
items.flame = new Flame(
    {
        scene: scene,
        position: new THREE.Vector3(-3, 0.2, 5),
        resolution: sizes.resolution,
        size: 0.5,
        scale: 0.5,
        count: 3,
    },
    pane
)

// Hologram Material & Rainbow Bubble
const hologramMaterial = new HologramMaterial({ color: new THREE.Color(0xffffff) } , pane)
// Suzanne
let suzanne = null
let suzanneRainbowBubble
gltfLoader.load('./suzanne.glb', (gltf) => {
        suzanne = gltf.scene
        suzanne.traverse((child) => {
            if(child.isMesh)
                child.material = hologramMaterial.material
        })
        suzanne.position.set(0, 2, -2)
        suzanne.scale.setScalar(0.7)
        scene.add(suzanne)

        suzanneRainbowBubble = new RainbowBubble({ scene: suzanne, scale: 1.6 }, pane)
    }
)

// Popping Heart
items.poppingHeart = new PoppingHeart(
    {
        scene: scene,
        position: new THREE.Vector3(0, 2, 0),
        count: 7,
        speed: 1.5,
        size: 1,
        height: 1,
        resolution: sizes.resolution,
    },
    pane
)

// Confetti
items.confetti = new Confetti(
    {
        scene: scene,
        position: new THREE.Vector3(0, 1, 2),
        count: 7,
        speed: 1,
        size: 1,
        height: 1,
        resolution: sizes.resolution,
    },
    pane
)


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
    // Update poppingHeart
    items.poppingHeart.update(delta)
    // Update confetti
    items.confetti.update(delta)
    
    
    // Rotate objects
    if(suzanne) {
        suzanne.rotation.x = - elapsed * 0.1
        suzanne.rotation.y = elapsed * 0.2
        // Update rainbowBubble
        if (suzanneRainbowBubble.state === 'on') {
            suzanne.position.x = Math.cos(elapsed * 0.6) * 5
            suzanne.position.y = Math.sin(elapsed * 1.4) * 2 + 2
            suzanne.position.z = Math.cos(elapsed * 0.2) * 3 - 2
        }
        suzanneRainbowBubble.update(delta)
    }

    // Update controls
    dev.render()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(render)
}

render()