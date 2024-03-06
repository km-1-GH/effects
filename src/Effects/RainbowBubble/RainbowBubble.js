import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'

/**
 * @module RainbowBubble
 * @param {Object} param - Parameters
 * @param {THREE.Scene | THREE.Mesh} param.scene - The scene or mesh to add the mesh to
 * @param {Number} param.scale - The scale of the mesh
 * @param {Number} param.speed - The speed of animation
 * @param {THREE.Vector3} param.position - The position of the mesh
 * @param {Pane} param.pane - The pane instance
 */

export default class RainbowBubble {
    constructor(param, pane=null) {
        this.scene = param.scene
        this.scale = param.scale || 1
        this.speed = param.speed || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)

        this.create()

        this.active = false
        this.elapsed = 0

        if (pane) this.setupGUI(pane)
    }

    create() {
        const geometry = new THREE.SphereGeometry(1, 32, 32)
        const material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
            },
        })

        this.anchor = new THREE.Mesh(geometry, material)
        this.anchor.scale.setScalar(this.scale)
        this.anchor.position.copy(this.position)
        this.anchor.visible = false
        this.scene.add(this.anchor)
    }

    activate(position=this.position) {
        this.anchor.position.copy(position)
        this.elapsed = 0
        this.active = true
        this.anchor.visible = true
    }

    stop() {
        this.active = false
        this.anchor.visible = false
        this.elapsed = 0
    }

    update(delta) {
        if (!this.active) return

        this.elapsed += delta
        this.anchor.material.uniforms.uTime.value = this.elapsed
    }

    setupGUI(pane) {
        const folder = pane.addFolder({title: 'Rainbow Bubble', expanded: false})

        folder.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        folder.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.stop() 
        })

        folder.addBinding(this, 'scale', {min: 0, max: 5, step: 0.01, label: 'Scale'})
            .on('change', value => this.anchor.scale.setScalar(value.value))

    }
}