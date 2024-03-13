import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import heartTex from '/heart.png'

/**
 * @module PoppingHeart
 * @param {Object} param - Particle Parameters
 * @param {THREE.Parent} param.parent - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector2} [param.resolution] - Resolution
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {number} [param.speed] - Animation Speed
 * @param {number} [param.count] - Particle Count
 * @param {number} [param.size] - Particle Size Scale
 * @param {number} [param.height] - How high the Particle goes
 * @param {THREE.Texture} [param.texture] - Texture
 * @param {Pane} [tweakpane] - tweakpane instance
 */

export default class PoppingHeart {
    constructor(param, pane=null) {
        this.parent = param.parent
        this.pixelRatio = param.pixelRatio || 1
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.speed = param.speed || 1
        this.count = param.count || 7
        this.size = param.size || 1
        this.height = param.height || 1
        this.texture = param.texture || new THREE.TextureLoader().load(heartTex)
        this.PARTICLE_SIZE = 1 * param.size

        this.texture.flipY = false
        this.anchor
        this.create(this.parent)

        this.elapsed = 0
        this.active = false
        
        if (pane) this.setupGUI(pane)
    }

    resize(resolution) {
        this.resolution = resolution
        this.anchor.material.uniforms.uResolution.value.set(this.resolution.x, this.resolution.y)
    }

    create(parent) {
        /**
         * geometry
         */
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.count * 3)
        const scales = new Float32Array(this.count)
        const delay = new Float32Array(this.count)

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3

            // position
            positions[i3 + 0] = (Math.random() * 2 - 1) * 0.02
            positions[i3 + 1] = Math.random() * 0.01 //上方向のみ
            positions[i3 + 2] = (Math.random() * 2 - 1) * 0.01
            scales[i] = 0.5 + Math.random() * 0.5
            delay[i] = i * (2 / this.count) + (Math.random()  * 2 - 1) * 0.1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1))

        /**
         * material
         */
        const uniforms = {}
        uniforms.uTime = { value: 0 }
        uniforms.uResolution = { value: this.resolution }
        uniforms.uSize = { value: this.PARTICLE_SIZE }
        uniforms.uTexture = { value: this.texture }
        uniforms.uHeight = { value: this.height }

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
        parent.add(this.anchor)

    }

    activate(position=this.position) {
        this.anchor.position.copy(position)
        this.active = true
        this.anchor.visible = true
        this.elapsed = 0
    }

    update(delta) {
        if (!this.active) return

        this.elapsed  += delta * this.speed
        this.anchor.material.uniforms.uTime.value = this.elapsed

        if (this.elapsed > 3) {
            this.active = false
            this.anchor.visible = false
        }
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        const tabs = pane.addTab({ pages: [ { title: 'Mesh'}, {title: 'Shader'} ] })
        const MeshParam = tabs.pages[0]
        const ShaderParam = tabs.pages[1]

        MeshParam.addBinding(this, 'speed', { min: 0, max: 3 })

        ShaderParam.addBinding(this, 'count', { min: 0, max: 30, step: 1, label: 'count'})
            .on('change', () => {
                this.active = false
                this.parent.remove(this.anchor)
                this.anchor.geometry.dispose()
                this.anchor.material.dispose()
                this.create(this.parent)
            })

        ShaderParam.addBinding(this, 'size', { min: 0, max: 3})
            .on('change', () => { this.anchor.material.uniforms.uSize.value = this.size })

        ShaderParam.addBinding(this, 'height', { min: 0, max: 3})
            .on('change', () => { this.anchor.material.uniforms.uHeight.value = this.height })

    }
}