import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import confettiTex from '/confetti.png'

/**
 * @module Confetti
 * @param {Object} [param] - Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector2} [param.resolution] - THREE canvas Resolution
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {number} [param.count] - Particle Count
 * @param {number} [param.size] - Particle Size Scale
 * @param {number} [param.hueOffset] - Hue Offset
 * @param {number} [param.hueRange] - Hue Range
 * @param {number} [param.saturation] - Saturation
 * @param {THREE.Vector3} [param.direction] - Pop Direction
 * @param {number} [param.duration] - How long the Particle pops
 * @param {THREE.Texture} [param.texture] - Texture
 * @param {Pane} [param.gui] - tweakpane instance
 */

export default class Confetti {
    constructor(param) {
        this.parent = param.parent || null
        this.pixelRatio = param.pixelRatio || 1
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.count = param.count || 30
        this.size = param.size || 1
        this.hueOffset = param.hueOffset || 0
        this.hueRange = param.hueRange || Math.PI * 2
        this.saturation = param.saturation || 0.5
        this.direction = param.direction || new THREE.Vector3(0, 1, 0)
        this.duration = param.duration || 10
        this.texture = param.texture || new THREE.TextureLoader().load(confettiTex)
        this.PARTICLE_SIZE = 1 * this.size

        this.texture.flipY = false
        this.object
        this.create()

        this.elapsed = 0
        this.active = false
        
        if (param.gui) this.setupGUI(param.gui)
    }

    resize(resolution) {
        this.resolution = resolution
        this.object.material.uniforms.uResolution.value.set(this.resolution.x, this.resolution.y)
    }

    create() {
        /**
         * geometry
         */
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.count * 3)
        const radius = new Float32Array(this.count)
        const scales = new Float32Array(this.count)
        const random = new Float32Array(this.count)

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3

            // position
            positions[i3 + 0] = (Math.random() * 2 - 1) * 0.02
            positions[i3 + 1] = (Math.random() * 2 - 1) * 0.01
            positions[i3 + 2] = (Math.random() * 2 - 1) * 0.01
            // radius
            radius[i] = Math.random() * 0.8 + 0.2 // 0.2 ~ 1
            // scale
            scales[i] = 0.4 + Math.random() * 0.6 // 0.3 ~ 1
            // random
            random[i] = Math.random() * 2 - 1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(random, 1))

        /**
         * material
         */
        const uniforms = {}
        uniforms.uTime = { value: 0 }
        uniforms.uResolution = { value: this.resolution }
        uniforms.uSize = { value: this.PARTICLE_SIZE }
        uniforms.uTexture = { value: this.texture }
        uniforms.uDirection = { value: this.direction }
        uniforms.uHueOffset = { value: this.hueOffset }
        uniforms.uHueRange = { value: this.hueRange }
        uniforms.uSaturation = { value: this.saturation }
        uniforms.uDuration = { value: this.duration }

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: uniforms,
            vertexShader,
            fragmentShader,
        })

        /**
         * object(Points)
         */
        this.object = new THREE.Points(geometry, material)
        this.object.position.copy(this.position)
        this.object.visible = false

        if (this.parent) this.parent.add(this.object)
    }

    activate(position=this.position) {
        this.object.position.copy(position)
        this.active = true
        this.object.visible = true
        this.elapsed = 0
    }

    deactivate() {
        this.active = false
        this.object.visible = false
    }

    update(delta) {
        if (!this.active) return

        this.elapsed += delta
        this.object.material.uniforms.uTime.value = this.elapsed

        if (this.elapsed > this.duration) {
            this.active = false
            this.object.visible = false
        }
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        pane.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.deactivate() 
        })

        pane.addBinding(this, 'count', { min: 30, max: 100, step: 1 })
            .on('change', () => {
                this.deactivate()
                if (!this.parent) this.parent = this.object.parent || null
                if (this.parent) this.parent.remove(this.object)
                this.object.geometry.dispose()
                this.object.material.dispose()
                this.create()
            })

        pane.addBinding(this, 'size', { min: 0, max: 3})
            .on('change', () => { this.object.material.uniforms.uSize.value = this.size })

        pane.addBinding(this, 'hueOffset', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.object.material.uniforms.uHueOffset.value = this.hueOffset })

        pane.addBinding(this, 'hueRange', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.object.material.uniforms.uHueRange.value = this.hueRange })

        pane.addBinding(this, 'saturation', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.object.material.uniforms.uSaturation.value = this.saturation })

        pane.addBinding(this.direction, 'x', { min: -1, max: 1, label: 'direction_x'})
            .on('change', () => { 
                this.deactivate()
                this.object.material.uniforms.uDirection.value.x = this.direction.x
                this.activate() 
            })

        pane.addBinding(this.direction, 'y', { min: -1, max: 1, label: 'direction_y'})
            .on('change', () => { 
                this.deactivate()
                this.object.material.uniforms.uDirection.value.x = this.direction.y
                this.activate() 
            })

        pane.addBinding(this.direction, 'z', { min: -1, max: 1, label: 'direction_z'})
            .on('change', () => { 
                this.deactivate()
                this.object.material.uniforms.uDirection.value.x = this.direction.z
                this.activate() 
            })

        pane.addBinding(this, 'duration', { min: 5, max: 20 })
            .on('change', () => { 
                this.deactivate()
                this.object.material.uniforms.uDuration.value = this.duration
                this.activate()
            })
    }
}