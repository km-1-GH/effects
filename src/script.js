import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import * as dev from './dev.js'
import SmokeParticle from './Effects/Smoke-Puff/SmokeParticle'
import SmokeCoffee from './Effects/Smoke-Coffee/Smoke-Coffee.js'
import Flame from './Effects/Flame/Flame.js'


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
    sizes.resolution.set(sizes.width, sizes.height)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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

// smokePuff
items.smokePuff = new SmokeParticle({
    scene: scene,
    position: new THREE.Vector3(-3, 1, 0),
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    size: 1.26,
    scale: 5,
    speed: 0.5,
    color1: new THREE.Color(0xffff00),
    color2: new THREE.Color(0xff0000),
    resolution: sizes.resolution,
})

// smokeCoffee
items.smokeCoffee = new SmokeCoffee({
    scene: scene,
    scale: 1,
    speed: 1,
    position: new THREE.Vector3(0, 1.83, 0),
})

//flame
items.flame = new Flame({
    scene: scene,
    position: new THREE.Vector3(0, 1, 0),
    resolution: sizes.resolution,
})

/**
 * Model
 */
gltfLoader.load(
    './bakedModel.glb',
    (gltf) =>
    {
        gltf.scene.getObjectByName('baked').material.map.anisotropy = 8
        scene.add(gltf.scene)
    }
)

// Hologram
const material = new THREE.MeshBasicMaterial()

// Torus knot
const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
    material
)
torusKnot.position.set(3, 5, 0)
scene.add(torusKnot)

// Sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(),
    material
)
sphere.position.set(-3, 5, 0)
scene.add(sphere)

// Suzanne
let suzanne = null
gltfLoader.load(
    './suzanne.glb',
    (gltf) =>
    {
        suzanne = gltf.scene
        suzanne.traverse((child) =>
        {
            if(child.isMesh)
                child.material = material
        })
        suzanne.position.set(0, 5, 0)
        scene.add(suzanne)
    }
)


/**
 * Start Functions
 */
dev.devSetup(camera, canvas, items)
items.smokePuff.activate()
items.smokeCoffee.activate()

/**
 * Animate
 */
const clock = new THREE.Clock()

let delta = 0
let elapsed = 0
let currentTime = 0

const tick = () =>
{
    elapsed = clock.getElapsedTime()
    delta = elapsed - currentTime
    currentTime = elapsed

    // Update smokePuff
    items.smokePuff.update(delta)
    if (items.smokePuff.anchor.userData.state === 'done') {
        items.smokePuff.activate()
    }

    // Update smokeCoffee
    items.smokeCoffee.update(delta)
    if (!items.smokeCoffee.active) items.smokeCoffee.activate()

    // Update flame
    items.flame.update(delta)


    // Rotate objects
    if(suzanne)
    {
        suzanne.rotation.x = - elapsed * 0.1
        suzanne.rotation.y = elapsed * 0.2
    }

    sphere.rotation.x = - elapsed * 0.1
    sphere.rotation.y = elapsed * 0.2

    torusKnot.rotation.x = - elapsed * 0.1
    torusKnot.rotation.y = elapsed * 0.2
    
    // Update controls
    dev.render()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()