import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import confettiTex from '/confetti.png'

/**
 * @module Confetti
 * @param {Object} param - Particle Parameters
 * @param {THREE.Scene} param.scene - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {THREE.Vector3} [param.direction] - Pop Direction
 * @param {number} [param.count] - Particle Count
 * @param {number} [param.duration] - How long the Particle pops
 * @param {number} [param.size] - Particle Size Scale
 * @param {THREE.Vector2} [param.resolution] - Resolution
 * @param {THREE.Texture} [param.texture] - Texture
 * @param {Pane} [tweakpane] - tweakpane instance
 */

export default class Confetti {
    constructor(param, pane=null) {
        this.scene = param.scene
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.count = param.count || 30
        this.duration = param.duration || 10
        this.direction = param.direction || new THREE.Vector3(0, 1, 0)
        this.size = param.size || 1
        this.hueOffset = param.hueOffset || 0
        this.hueRange = param.hueRange || Math.PI * 2
        this.saturation = param.saturation || 0.5
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        this.texture = param.texture || new THREE.TextureLoader().load(confettiTex)
        this.PARTICLE_SIZE = 1 * param.size

        this.texture.flipY = false
        this.anchor
        this.create(this.scene)

        this.elapsed = 0
        this.active = false
        
        if (pane) this.setupGUI(pane)
    }

    resize(resolution) {
        this.resolution = resolution
        this.anchor.material.uniforms.uResolution.value.set(this.resolution.x, this.resolution.y)
    }

    create(scene) {
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
         * anchor(Points)
         */
        this.anchor = new THREE.Points(geometry, material)
        this.anchor.position.copy(this.position)
        this.anchor.visible = false
        scene.add(this.anchor)
    }

    activate() {
        this.active = true
        this.anchor.visible = true
        this.elapsed = 0
    }

    deactivate() {
        this.active = false
        this.anchor.visible = false
    }

    update(delta) {
        if (!this.active) return
        this.elapsed  += delta
        this.anchor.material.uniforms.uTime.value = this.elapsed

        if (this.elapsed > this.duration) {
            this.active = false
            this.anchor.visible = false
        }
    }

    setupGUI(pane) {
        const folder = pane.addFolder({ title: 'Confetti', expanded: false})

        folder.addButton({ title: 'Run' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        folder.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.deactivate() 
        })

        folder.addBinding(this.direction, 'x', { min: -1, max: 1, label: 'direction_x'})
            .on('change', () => { 
                this.deactivate()
                this.anchor.material.uniforms.uDirection.value.x = this.direction.x
                this.activate() 
            })

        folder.addBinding(this.direction, 'y', { min: -1, max: 1, label: 'direction_y'})
            .on('change', () => { 
                this.deactivate()
                this.anchor.material.uniforms.uDirection.value.x = this.direction.y
                this.activate() 
            })

        folder.addBinding(this.direction, 'z', { min: -1, max: 1, label: 'direction_z'})
            .on('change', () => { 
                this.deactivate()
                this.anchor.material.uniforms.uDirection.value.x = this.direction.z
                this.activate() 
            })

        folder.addBinding(this, 'duration', { min: 5, max: 20 })
            .on('change', () => { 
                this.deactivate()
                this.anchor.material.uniforms.uDuration.value = this.duration
                this.activate()
            })

        folder.addBinding(this, 'size', { min: 0, max: 3})
            .on('change', () => { this.anchor.material.uniforms.uSize.value = this.size })

        folder.addBinding(this, 'hueOffset', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.anchor.material.uniforms.uHueOffset.value = this.hueOffset })

        folder.addBinding(this, 'hueRange', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.anchor.material.uniforms.uHueRange.value = this.hueRange })

        folder.addBinding(this, 'saturation', { min: 0, max: 1, step: 0.01 })
            .on('change', () => { this.anchor.material.uniforms.uSaturation.value = this.saturation })

        folder.addBinding(this, 'count', { min: 30, max: 100, step: 1, label: 'count'})
            .on('change', () => {
                this.deactivate()
                this.scene.remove(this.anchor)
                this.anchor.geometry.dispose()
                this.anchor.material.dispose()
                this.create(this.scene)
            })
    }
}