import * as THREE from 'three'

import * as dev from './dev.js'
import worldMapSrc from '/TextureClone/world-map-japan.webp'

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
    
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    
    sizes.resolution.set(sizes.width, sizes.height)
})

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 300)
camera.position.set(0, 0, 0.1)
camera.lookAt(0, 0, -1)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Loaders
 */

/**
 * Mesh
 */
const items = {}
dev.devSetup(camera, canvas)
const pane = dev.getPane()

/**
 * Test Mesh
 */
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshNormalMaterial()
const testCube = new THREE.Mesh(geometry, material)
testCube.position.set(0, 0, -30)
scene.add(testCube)

/**
 * anchor
 */
const planeWidth = 20
const planeHeight = 20 * (756 / 1024)
const mapTranslateY = -2.02
const anchor = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight).translate(0, mapTranslateY, 0),
    new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
)

/**
 * WorldMap case1: one big plane with one texture
 */
const anchorCase1 = anchor.clone()
anchorCase1.position.set(-5, 5, -30)
scene.add(anchorCase1)

new THREE.TextureLoader().load(worldMapSrc, worldMapTexture => {
    
    const case1Texture = worldMapTexture.clone()
    case1Texture.repeat.set(1, 1)
    case1Texture.offset.x = 0
    case1Texture.offset.y = 0
    case1Texture.wrapS = THREE.RepeatWrapping
    case1Texture.wrapT = THREE.RepeatWrapping
    case1Texture.minFilter = THREE.NearestFilter
    case1Texture.magFilter = THREE.NearestFilter
    
    const map1 = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight).translate(0, mapTranslateY, 0),
        new THREE.MeshBasicMaterial({ map: case1Texture, transparent: true, opacity: 1 })
    )
    map1.position.set(0, 0, 0)
    anchorCase1.add(map1)
})

/**
 * WorldMap case2: multi small planes with one texture cloned for each AS USUAL
 */
const colCount = 8
const rowCount = 6
const smallPlaneWidth = planeWidth / colCount
const smallPlaneHeight = planeHeight / rowCount
const smallPlaneStartX = planeWidth / 2 * -1 + smallPlaneWidth * 0.5
const smallPlaneStartY = planeHeight / 2 * -1 + smallPlaneHeight * 0.5
const smallPlaneGeometry = new THREE.PlaneGeometry(smallPlaneWidth, smallPlaneHeight).translate(0, mapTranslateY, 0)

const anchorCase2 = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight, colCount, rowCount).translate(0, mapTranslateY, 0),
    anchor.material
)
anchorCase2.position.set(0, 0, -29)
scene.add(anchorCase2)

// new THREE.TextureLoader().load(worldMapSrc, worldMapTexture => {
//     for (let col = 0; col < colCount; col++) {
//         for (let row = 0; row < rowCount; row++) {
//             const clonedTex = worldMapTexture.clone()
    
//             clonedTex.repeat.set(1 / colCount, 1 / rowCount)
//             clonedTex.offset.set(col / colCount, row / rowCount)
    
//             const smallPlane = new THREE.Mesh(
//                 smallPlaneGeometry,
//                 new THREE.MeshBasicMaterial({ map: clonedTex })
//             )
//             smallPlane.position.set(smallPlaneStartX + col * smallPlaneWidth, smallPlaneStartY + row * smallPlaneHeight, 0)
//             anchorCase2.add(smallPlane)
//         }
//     }
// })

/**
 * WorldMap case3: multi small planes with one texture cloned for each USING Source Class 
 */
const anchorCase3 = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight, colCount, rowCount).translate(0, mapTranslateY, 0),
    anchor.material
)
anchorCase3.position.set(5, -5, -28)
scene.add(anchorCase3)

// new THREE.ImageLoader().load(worldMapSrc, worldMapTexture => {
//     const texture = new THREE.Texture()
//     texture.source = new THREE.Source(worldMapTexture)
//     texture.needsUpdate = true

//     for (let col = 0; col < colCount; col++) {
//         for (let row = 0; row < rowCount; row++) {
//             const clonedTex = texture.clone()
    
//             clonedTex.repeat.set(1 / colCount, 1 / rowCount)
//             clonedTex.offset.set(col / colCount, row / rowCount)
    
//             const smallPlane = new THREE.Mesh(
//                 smallPlaneGeometry,
//                 new THREE.MeshBasicMaterial({ map: clonedTex })
//             )
//             smallPlane.position.set(smallPlaneStartX + col * smallPlaneWidth, smallPlaneStartY + row * smallPlaneHeight, 0)
//             anchorCase3.add(smallPlane)
//         }
//     }
// })


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

    testCube.rotation.x += delta
    testCube.rotation.y += delta * 1.3

    // test performance of texture clone
    anchorCase1.scale.setScalar(1 + Math.abs(Math.sin(elapsed * 0.5)) * 8)
    anchorCase1.position.x = Math.sin(elapsed * 0.5) * 20
    anchorCase2.scale.setScalar(1 + Math.abs(Math.sin(elapsed * 0.5)) * 8)
    anchorCase2.position.x = Math.sin(elapsed * 0.5) * 20
    anchorCase3.scale.setScalar(1 + Math.abs(Math.sin(elapsed * 0.5)) * 8)
    anchorCase3.position.x = Math.sin(elapsed * 0.5) * 20
    // Update controls
    dev.render()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(render)
}

render()
