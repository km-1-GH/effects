import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'

/**
 * @module HologramMaterial
 * @param {Object} param - Parameters
 * @param {THREE.Scene | THREE.Mesh} param.scene - The scene or mesh to add the mesh to
 * @param {THREE.Color} param.color - The color of the mesh
 * @param {Pane} param.pane - The pane instance
 */

export default class HologramMaterial {
    constructor(param, pane=null) {
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 },
                uSpeed: { value: param.speed || 1},
                uColor: { value: param.color || new THREE.Color(0xffffff)},
            },
        })

        this.active = false
        this.elapsed = 0

        if (pane) this.setupGUI(pane)
    }

    activate() {
        this.elapsed = 0
        this.active = true
        this.material.uniforms.uOpacity.value = 1
    }

    stop() {
        this.active = false
        this.material.uniforms.uOpacity.value = 0
        this.elapsed = 0
    }

    update(delta) {
        if (!this.active) return

        this.elapsed += delta * this.speed
        this.material.uniforms.uTime.value = this.elapsed
    }

    setupGUI(pane) {
        const folder = pane.addFolder({title: 'Hologram Material', expanded: false})

        folder.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        folder.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.stop() 
        })

        folder.addBinding(this.material.uniforms.uSpeed, 'value', {min: 0.1, max: 5, step: 0.01, label: 'Speed'})

        folder.addBinding(
            this.material.uniforms.uColor, 
            'value', 
            {color: {type: 'float'}, label: 'Color'}
        ).on('change', value => {
            this.material.uniforms.uColor.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.material.uniforms.uColor.value.getHexString()}`)
        })
    }
}