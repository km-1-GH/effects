import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module SmokeCoffee
 * @param {Object} param - Parameters
 * @param {THREE.Scene | THREE.Mesh} param.parent - The scene or mesh to add the smoke to
 * @param {THREE.Vector3} param.position - The position of the smoke
 * @param {Number} param.scale - The scale of the smoke
 * @param {Number} param.speed - The speed of animation
 * @param {THREE.Color} param.color - The color of the smoke
 * @param {THREE.Texture} param.texture - The path to the noise texture to use for the smoke 
 * @param {Pane} param.pane - The pane instance
 */

export default class SmokeCoffee {
    constructor(param, pane=null) {
        this.parent = param.parent
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.scale = param.scale || 1
        this.speed = param.speed || 1
        this.color = param.color || new THREE.Color(0xffffff)
        this.noiseTex = param.noise || new THREE.TextureLoader().load(noise)
        this.noiseTex.wrapS = THREE.RepeatWrapping
        this.noiseTex.wrapT = THREE.RepeatWrapping

        this.create()

        this.active = false
        this.elapsed = 0

        if (pane) this.setupGUI(pane)
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
        })

        this.anchor = new THREE.Mesh(geometry, material)
        this.anchor.scale.setScalar(this.scale)
        this.anchor.position.copy(this.position)
        this.parent.add(this.anchor)
        this.anchor.visible = false
    }

    activate(position=this.position) {
        this.anchor.position.copy(position)
        this.anchor.visible = true
        this.elapsed = 0
        this.active = true
    }

    stop() {
        this.anchor.visible = false
        this.active = false
    }

    update(delta, speed=this.speed) {
        if (!this.active) return

        this.elapsed += delta * speed
        this.anchor.material.uniforms.uTime.value = this.elapsed
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        pane.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.stop() 
        })

        const tabs = pane.addTab({ pages: [ { title: 'Mesh'}, {title: 'Shader'} ] })
        const MeshParam = tabs.pages[0]
        const ShaderParam = tabs.pages[1]

        MeshParam.addBinding(this, 'scale', { min: 0, max: 10 })
            .on('change', value => { this.anchor.scale.setScalar(value.value) })

        MeshParam.addBinding(this, 'speed', { min: 0, max: 20 })

        ShaderParam.addBinding(
            this.anchor.material.uniforms.uColor, 
            'value', 
            {color: {type: 'float'}, label: 'Color'}
        ).on('change', value => {
            this.anchor.material.uniforms.uColor.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.anchor.material.uniforms.uColor.value.getHexString()}`)
        })
    }
}