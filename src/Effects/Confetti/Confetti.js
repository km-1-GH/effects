import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import confettiTex from '/confetti.png'

/**
 * @module Confetti
 * @param {Object} [param] - Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add, default: null
 * @param {number} [param.pixelRatio] - window.devicePixelRatio, default: 1
 * @param {THREE.Vector2} [param.resolution] - THREE canvas Resolution, default: new THREE.Vector2(1000, 750)
 * @param {THREE.Vector3} [param.position] - default Position, default: new THREE.Vector3(0, 0, 0)
 * @param {number} [param.count] - Particle Count, default: 30
 * @param {number} [param.size] - Particle Size Scale, default: 1
 * @param {number} [param.hueOffset] - Hue Offset, default: 0
 * @param {number} [param.hueRange] - Hue Range, default: 1
 * @param {number} [param.saturation] - Saturation, default: 0.5
 * @param {THREE.Vector3} [param.direction] - Pop Direction, default: new THREE.Vector3(0, 1, 0)
 * @param {number} [param.duration] - How long the Particle pops, default:10
 * @param {THREE.Texture} [param.texture] - Texture
 * @param {Pane} [param.gui] - tweakpane instance
 */

export default class Confetti {
    constructor(param) {
        this.parent = param.parent || null
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.count = param.count || 30
        this.size = param.size || 1
        this.texture = param.texture || new THREE.TextureLoader().load(confettiTex)
        this.direction = param.direction || new THREE.Vector3(0, 1, 0)
        
        this.PARTICLE_SIZE = 1 * this.size * this.pixelRatio
        this.texture.flipY = false

        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: param.resolution || new THREE.Vector2(1000, 750) },
            uSize: { value: this.PARTICLE_SIZE },
            uTexture: { value: this.texture },
            uDirection: { value: this.direction },
            uHueOffset: { value:  param.hueOffset || 0 },
            uHueRange: { value: param.hueRange || 1 },
            uSaturation: { value: param.saturation || 0.5 },
            uDuration: { value: param.duration || 10 },
        }

        this.object = this.create()

        this.elapsed = 0
        this.active = false
        
        if (param.gui) this.setupGUI(param.gui)
    }

    resize(resolution) {
        this.uniforms.uResolution.value.set(resolution.x, resolution.y)
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
        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader,
        })

        /**
         * object(Points)
         */
        const object = new THREE.Points(geometry, material)
        object.position.copy(this.position)
        object.visible = false

        if (this.parent) this.parent.add(object)

        return object
    }

    activate(position=this.position, direction=this.direction) {
        this.object.position.copy(position)
        this.uniforms.uDirection.value = direction
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
                this.object = null
                this.object = this.create()
            })

        pane.addBinding(this, 'size', { min: 0.1, max: 1, step: 0.001 })
            .on('change', value => {
                this.uniforms.uSize.value = 1 * value.value * this.pixelRatio
            })


        pane.addBinding(this.uniforms.uHueOffset, 'value', { min: 0, max: 1, step: 0.01, label: 'uHueOffset'})

        pane.addBinding(this.uniforms.uHueRange, 'value', { min: 0, max: 1, step: 0.01, label: 'uHueRange'})

        pane.addBinding(this.uniforms.uSaturation, 'value',  { min: 0, max: 1, step: 0.01, label: 'uSaturation'})

        pane.addBinding(this.uniforms.uDirection.value, 'x', { min: -1, max: 1, label: 'direction_x'})
            .on('change', () => { 
                this.deactivate()
                this.activate() 
            })

        pane.addBinding(this.uniforms.uDirection.value, 'y', { min: -1, max: 1, label: 'direction_y'})
            .on('change', () => { 
                this.deactivate()
                this.activate() 
            })

        pane.addBinding(this.uniforms.uDirection.value, 'z', { min: -1, max: 1, label: 'direction_z'})
            .on('change', () => { 
                this.deactivate()
                this.activate() 
            })

        pane.addBinding(this.uniforms.uDuration, 'value', { min: 5, max: 20, label: 'duration'})
            .on('change', () => { 
                this.deactivate()
                this.activate()
            })
    }
}