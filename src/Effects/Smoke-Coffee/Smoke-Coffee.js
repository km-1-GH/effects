import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module SmokeCoffee
 * @param {Object} [param] - Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {Number} [param.scale] - The scale of the mesh
 * @param {Number} [param.speed] - The speed of animation
 * @param {THREE.Color} [param.color] - The color of
 * @param {THREE.Texture} [param.noise] - The noise texture
 * @param {Pane} [param.gui] - tweakpane instance
 */

export default class SmokeCoffee {
    constructor(param) {
        this.parent = param.parent || null
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

        if (param.gui) this.setupGUI(param.gui)
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

        this.object = new THREE.Mesh(geometry, material)
        this.object.scale.setScalar(this.scale)
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

    update(delta, speed=this.speed) {
        if (!this.active) return

        this.elapsed += delta * speed
        this.object.material.uniforms.uTime.value = this.elapsed
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        pane.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.deactivate() 
        })

        const tabs = pane.addTab({ pages: [ { title: 'Mesh'}, {title: 'Shader'} ] })
        const MeshParam = tabs.pages[0]
        const ShaderParam = tabs.pages[1]

        MeshParam.addBinding(this, 'scale', { min: 0, max: 10 })
            .on('change', value => { this.object.scale.setScalar(value.value) })

        MeshParam.addBinding(this, 'speed', { min: 0, max: 20 })

        ShaderParam.addBinding(
            this.object.material.uniforms.uColor, 
            'value', 
            {color: {type: 'float'}, label: 'Color'}
        ).on('change', value => {
            this.object.material.uniforms.uColor.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.object.material.uniforms.uColor.value.getHexString()}`)
        })
    }
}