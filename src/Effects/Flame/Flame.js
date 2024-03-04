import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'

/**
 * @module Flame
 * @param {Object} param - Particle Parameters
 * @param {THREE.Scene} param.scene - Parent Mesh to add
 * @param {number} param.pixelRatio - window.devicePixelRatio
 * @param {THREE.Vector3} param.position - default Position
 * @param {number} param.particleCount - Number of Particles
 * @param {number} param.size - Particle Size Scale
 * @param {number} param.speed - Animation Speed
 * @param {String} param.color1 - Main Color
 * @param {String} param.color2 - Rim Color
 * @param {THREE.Vector2} [param.resolution=new THREE.Vector2(1000, 750)] - canvas' Resolution
 */

export default class Flame {
    constructor(param) {
        this.scene = param.scene
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.particleCount = param.particleCount || 100
        this.size = param.size || 1
        const color1 = param.color1 || 0xffffff
        const color2 = param.color2 || 0xd1d1d1
        this.speed = param.speed || 0.5
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        
        this.colors = [
            new THREE.Color(color1),
            new THREE.Color(color2),
        ]
        this.PARTICLE_SIZE = 0.86 * this.size

        this.anchor
        this.create(this.scene)

        this.elapsed = 0
    }

    create(scene) {
        /**
         * geometry
         */
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.particleCount * 3)
        const scales = new Float32Array(this.particleCount)
        const delays = new Float32Array(this.particleCount)

        for (let i = 0; i < this.particleCount; i++) {
            // position
            const i3 = i * 3
            positions[i3 + 0] = Math.random() * 2 - 1 // -1 ~ 1
            positions[i3 + 1] = Math.random() * -0.2 - 0.8 // -0.8 ~ -1
            positions[i3 + 2] = (Math.random() * 2 - 1) * -0.2 // -0.2 ~ 0.2
            // scale
            scales[i] = 1.0 + Math.random() * 0.4 // 0.8 ~ 1.2
            // time
            delays[i] = Math.random() // 0 ~ 1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1))

        /**
         * material
         */
        const uniforms = {}
        uniforms.uTime = { value: 0 }
        uniforms.uPixelRatio = { value: this.pixelRatio }
        uniforms.uSize = { value: this.PARTICLE_SIZE }
        uniforms.uResolution = { value: this.resolution }
        for (let i = 0; i < this.colors.length; i++) {
            uniforms[`uColor${i + 1}`] = { value: this.colors[i] }
        }

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader,
            fragmentShader,
            uniforms: uniforms,
        })

        /**
         * anchor(Points)
         */
        this.anchor = new THREE.Points(geometry, material)
        this.anchor.position.copy(this.position)
        // this.anchor.visible = false  /////////////
        this.anchor.userData.state = 'off'
        scene.add(this.anchor)
    }

    activate(position=this.position) {
    }

    update(delta, speed=this.speed) {
        this.elapsed += delta * speed
        this.anchor.material.uniforms.uTime.value = this.elapsed
    }

 }
