import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module RainbowBubble
 * @param {Object} [param] - Particle Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add
 * @param {THREE.Vector3} [param.position] - The position of the mesh
 * @param {Number} [param.scale] - The scale of the mesh
 * @param {Boolean} [param.distortion] - The distortion flag
 * @param {Number} [param.hueOffset] - The hue offset 0~1
 * @param {Number} [param.hueRange] - The hue range 0~1
 * @param {Pane} [param.gui] - The pane instance
 * @param {Number} [param.speed] - The speed of popping
 * @param {Number} [param.uPopNoiseFrequency] - The noise frequency when pop
 */

export default class RainbowBubble {
    constructor(param) {
        this.parent = param.parent || null
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.scale = param.scale || 1
        this.distortion = param.distortion || false
        this.hueOffset = param.hueOffset || 0.51
        this.hueRange = param.hueRange || 0.2
        this.noiseTex = new THREE.TextureLoader().load(noise)
        this.noiseTex.wrapS = this.noiseTex.wrapT = THREE.RepeatWrapping
        this.speed = param.speed || 1
        this.popNoiseFrequency = param.uPopNoiseFrequency || 0.22

        this.create()

        this.state = 'off'
        this.elapsed = 0

        this.disposed = false

        if (param.gui) this.setupGUI(param.gui)
    }

    create() {
        const geometry = new THREE.SphereGeometry(1.5, 32, 32)
        const material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uPopTime: { value: 0 },
                uNoiseTex: { value: this.noiseTex },
                uHueOffset: { value: this.hueOffset },
                uHueRange: { value: this.hueRange },
                uDistortionStrength: { value: this.distortion ? 1 : 0 },
                uPopSpeed: { value: this.speed },
                uPopNoiseFrequency: { value: this.popNoiseFrequency },
            },
        })

        this.object = new THREE.Mesh(geometry, material)
        this.object.scale.setScalar(this.scale)
        this.object.position.copy(this.position)
        this.object.visible = false

        if (this.parent) this.parent.add(this.object)
    }

    activate(position=this.position) {
        if (this.disposed) return

        this.object.position.copy(position)
        this.elapsed = 0
        this.state = 'on'
        this.object.visible = true
        this.object.material.uniforms.uPopTime.value = 0
    }

    pop() {
        if (this.disposed) return

        this.state = 'pop'
        this.elapsed = 0
    }

    stop() {
        if (this.disposed) return

        this.state = 'off'
        this.object.visible = false
        this.object.material.uniforms.uPopTime.value = 0
        this.elapsed = 0
    }

    update(delta) {
        if (this.disposed) return
        if (this.state === 'off') return

        if (this.state === 'pop') {
            this.elapsed += delta
            this.object.material.uniforms.uPopTime.value = this.elapsed
            if (this.elapsed > 1) this.stop()
            return
        }

        this.elapsed += delta
        this.object.material.uniforms.uTime.value = this.elapsed
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (this.state === 'off') this.activate() 
        })

        pane.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.state === 'on') this.pop() 
        })

        const tabs = pane.addTab({ pages: [ { title: 'Mesh'}, {title: 'Shader'} ] })
        const MeshParam = tabs.pages[0]
        const ShaderParam = tabs.pages[1]

        MeshParam.addBinding(this, 'scale', {min: 0, max: 5 })
            .on('change', () => this.object.scale.setScalar(this.scale))

        ShaderParam.addBinding(this, 'hueOffset', {min: 0, max: 1, step: 0.01 })
            .on('change', () => this.object.material.uniforms.uHueOffset.value = this.hueOffset)

        ShaderParam.addBinding(this, 'hueRange', {min: 0, max: 1 })
            .on('change', () => this.object.material.uniforms.uHueRange.value = this.hueRange)

        ShaderParam.addBinding(this, 'distortion')
            .on('change', () => this.object.material.uniforms.uDistortionStrength.value = this.distortion ? 1 : 0)

        ShaderParam.addBinding(this, 'speed', {min: 0, max: 2})
            .on('change', () => this.object.material.uniforms.uPopSpeed.value = this.speed)

        ShaderParam.addBinding(this, 'popNoiseFrequency', {min: 0.1, max: 2})
            .on('change', () => this.object.material.uniforms.uPopNoiseFrequency.value = this.popNoiseFrequency)
    }

    dispose() {
        if (this.disposed) return
        this.disposed = true

        this.object.material.dispose()
        this.object.geometry.dispose()
    }
}
