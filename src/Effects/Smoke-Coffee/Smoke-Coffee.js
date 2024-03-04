import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module SmokeCoffee
 * @param {Object} param - Parameters
 * @param {THREE.Scene | THREE.Mesh} param.scene - The scene or mesh to add the smoke to
 * @param {THREE.Texture} param.texture - The path to the noise texture to use for the smoke 
 * @param {THREE.Color} param.color - The color of the smoke
 * @param {Number} param.scale - The scale of the smoke
 * @param {Number} param.speed - The speed of the smoke
 * @param {THREE.Vector3} param.position - The position of the smoke
 */

export default class SmokeCoffee {
    constructor(param) {
        this.scene = param.scene
        this.color = param.color || new THREE.Color(0xffffff)
        this.scale = param.scale || 1
        this.speed = param.speed || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.noiseTex = param.noise || new THREE.TextureLoader().load(noise)
        this.noiseTex.wrapS = THREE.RepeatWrapping
        this.noiseTex.wrapT = THREE.RepeatWrapping

        this.create()

        this.active = false
        this.theta = 0
    }

    create() {
        const geometry = new THREE.PlaneGeometry(1, 1, 16, 64)
            .translate(0, 0.5, 0)
            .scale(1, 4, 1)

        const material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader,
            fragmentShader,
            uniforms: {
                uPerlinTexture: { value: this.noiseTex},
                uTime: { value: 0 },
                uColor: { value: this.color },
            },
            depthWrite: false,
            // wireframe: true,
        })

        this.anchor = new THREE.Mesh(geometry, material)
        this.anchor.scale.setScalar(this.scale)
        this.anchor.position.copy(this.position)
        this.scene.add(this.anchor)
        this.anchor.visible = false
    }

    activate(position=this.position) {
        this.anchor.position.copy(position)
        this.anchor.visible = true
        this.theta = 0
        this.active = true
    }

    update(delta, speed=this.speed) {
        if (!this.active) return

        this.theta += delta * speed
        this.anchor.material.uniforms.uTime.value = this.theta

        if (this.theta >= 30) {
            this.anchor.visible = false
            this.active = false
        }
    }
}