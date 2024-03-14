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
 * @param {Number} [param.hueOffset] - The hue offset
 * @param {Number} [param.hueRange] - The hue range
 * @param {THREE.Texture} [param.texture] - The noise texture
 * @param {Pane} [param.pane] - The pane instance
 */

export default class RainbowBubble {
    constructor(param) {
        this.parent = param.parent || null
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.scale = param.scale || 1
        this.hueOffset = param.hueOffset || 0.51
        this.hueRange = param.hueRange || 0.2
        this.noiseTex = param.texture || new THREE.TextureLoader().load(noise)

        this.create()

        this.state = 'off'
        this.elapsed = 0

        if (param.pane) this.setupGUI(param.pane)
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
            },
        })

        this.object = new THREE.Mesh(geometry, material)
        this.object.scale.setScalar(this.scale)
        this.object.position.copy(this.position)
        this.object.visible = false

        if (this.parent) this.parent.add(this.object)
    }

    activate(position=this.position) {
        this.object.position.copy(position)
        this.elapsed = 0
        this.state = 'on'
        this.object.visible = true
        this.object.material.uniforms.uPopTime.value = 0
    }

    pop() {
        this.state = 'pop'
        this.elapsed = 0
    }

    stop() {
        this.state = 'off'
        this.object.visible = false
        this.object.material.uniforms.uPopTime.value = 0
        this.elapsed = 0
    }

    update(delta) {
        if (this.state === 'off') return

        if (this.state === 'pop') {
            this.elapsed += delta * 5
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
    }
}