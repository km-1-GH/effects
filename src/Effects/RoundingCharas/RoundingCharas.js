import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import charaTex from '/rounding-charas.webp'

/**
 * @module RoundingCharas
 * @param {Object} [param] - Particle Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector2} [param.resolution] - THREE canvas Resolution
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {number} [param.speed] - Animation Speed
 * @param {number} [param.count] - Particle Count
 * @param {number} [param.size] - Particle Size Scale
 * @param {number} [param.radius] - How high the Particle goes
 * @param {THREE.Texture} [param.texture] - Texture (3x3)
 * @param {number[]} [param.texOffsetIndex] - Index Array for Texture Offset (3x3)
 * @param {Pane} [param.gui] - tweakpane instance
 */

export default class RoundingCharas {
    constructor(param) {
        this.parent = param.parent || null
        this.pixelRatio = param.pixelRatio || 1
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.speed = param.speed || 1
        this.count = param.count || 9
        this.size = param.size || 1
        this.radius = param.radius || 1
        this.texture = param.texture || new THREE.TextureLoader().load(charaTex)
        this.texOffsetIndexArray = param.texOffsetIndex || [0, 1, 2, 3, 4, 5, 6, 7, 8]
        this.PARTICLE_SIZE = 1 * this.size * this.pixelRatio

        this.texture.flipY = false
        this.textureOffsets = [
            { x: 0, y: 0 },
            { x: 1/3, y: 0 },
            { x: 2/3, y: 0 },
            { x: 0, y: 1/3 },
            { x: 1/3, y: 1/3 },
            { x: 2/3, y: 1/3 },
            { x: 0, y: 2/3 },
            { x: 1/3, y: 2/3 },
            { x: 2/3, y: 2/3 },
        ]
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
        const delay = new Float32Array(this.count)
        const thetaAttribute = new Float32Array(this.count)
        const texOffsets  = new Float32Array(this.count * 2)

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3
            const i2 = i * 2

            // position
            const theta = Math.PI * 2 * i / this.count
            positions[i3 + 0] = 0
            positions[i3 + 1] = 0
            positions[i3 + 2] = Math.random() * 0.01
            // delay
            delay[i] = i * (2 / this.count) + (Math.random() * 2 - 1)
            // theta
            thetaAttribute[i] = theta
            // texture index
            const offset = i % this.texOffsetIndexArray.length
            texOffsets[i2 + 0] = this.textureOffsets[this.texOffsetIndexArray[offset]].x
            texOffsets[i2 + 1] = this.textureOffsets[this.texOffsetIndexArray[offset]].y
        }


        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1))
        geometry.setAttribute('aTheta', new THREE.BufferAttribute(thetaAttribute, 1))
        geometry.setAttribute('aTexOffset', new THREE.BufferAttribute(texOffsets, 2))

        /**
         * material
         */
        const uniforms = {}
        uniforms.uTime = { value: 0 }
        uniforms.uResolution = { value: this.resolution }
        uniforms.uSize = { value: this.PARTICLE_SIZE }
        uniforms.uTexture = { value: this.texture }
        uniforms.uRadius = { value: this.radius }

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

    update(delta) {
        if (!this.active) return

        this.elapsed += delta * this.speed
        this.object.material.uniforms.uTime.value = this.elapsed
    }

    stop() {
        this.active = false
        this.object.visible = false
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

        MeshParam.addBinding(this, 'speed', { min: 0, max: 3 })

        ShaderParam.addBinding(this, 'count', { min: 0, max: 30, step: 1 })
            .on('change', () => {
                this.active = false
                if (!this.parent) this.parent = this.object.parent || null
                if (this.parent) this.parent.remove(this.object)
                this.object.geometry.dispose()
                this.object.material.dispose()
                this.create()
            })

        ShaderParam.addBinding(this, 'size', { min: 0, max: 10})
            .on('change', () => { this.object.material.uniforms.uSize.value = this.size })

        ShaderParam.addBinding(this, 'radius', { min: 0, max: 10})
            .on('change', () => { this.object.material.uniforms.uRadius.value = this.radius })

    }
}
