import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import * as dev from './dev.js'
import SmokeParticle from './Effects/Smoke-Puff/SmokeParticle'
import SmokeCoffee from './Effects/Smoke-Coffee/Smoke-Coffee.js'
import Flame from './Effects/Flame/Flame.js'
import HologramMaterial from './Effects/Hologram/HologramMaterial.js'
import RainbowBubble from './Effects/RainbowBubble/RainbowBubble.js'


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
camera.position.x = 8
camera.position.y = 10
camera.position.z = 12
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
 * Textures
 */

/**
 * Mesh
 */
const items = {}
const pane = dev.devSetup(camera, canvas)

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

//flame
items.flame = new Flame(
    {
        scene: scene,
        position: new THREE.Vector3(0, 0.5, 1),
        resolution: sizes.resolution,
        size: 0.5,
        scale: 0.5,
    },
    pane
)

// Hologram Material
const hologramMaterial = new HologramMaterial({ color: new THREE.Color(0xffffff) } , pane)

// Rainbow Bubble
items.rainbowBubble = new RainbowBubble({ scene: scene, position: new THREE.Vector3(-3, 5, 0) }, pane)

// mesh inside Bubble
const insideSphere = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.4, 0.1, 100, 16),
    new THREE.MeshBasicMaterial({ color: 'pink' })
)
insideSphere.position.copy(items.rainbowBubble.position)
scene.add(insideSphere)

// Suzanne
let suzanne = null
gltfLoader.load('./suzanne.glb', (gltf) => {
        suzanne = gltf.scene
        suzanne.traverse((child) => {
            if(child.isMesh)
                child.material = hologramMaterial.material
        })
        suzanne.position.set(0, 5, 0)
        scene.add(suzanne)
    }
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
    // Update flame
    items.flame.update(delta)
    // Update hologramMaterial
    hologramMaterial.material.uniforms.uTime.value = elapsed
    // Update rainbowBubble
    items.rainbowBubble.update(delta)
    insideSphere.rotation.x = elapsed * 0.1
    insideSphere.rotation.y = - elapsed * 0.2


    // Rotate objects
    if(suzanne) {
        suzanne.rotation.x = - elapsed * 0.1
        suzanne.rotation.y = elapsed * 0.2
    }

    // Update controls
    dev.render()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(render)
}

render()