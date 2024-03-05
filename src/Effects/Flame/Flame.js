import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'
import flame1 from '/flame_01.png'
import flame2 from '/flame_02.png'
import flame3 from '/flame_03.png'
import flame4 from '/flame_04.png'

/**
 * @module Flame
 * @param {Object} param - Particle Parameters
 * @param {THREE.Scene} param.scene - Parent Mesh to add
 * @param {number} param.pixelRatio - window.devicePixelRatio
 * @param {THREE.Vector3} param.position - default Position
 * @param {number} param.particleCount - Number of Particles
 * @param {number} param.size - Particle Size Scale
 * @param {number} param.scale - Mesh Scale
 * @param {number} param.speed - Animation Speed
 * @param {String} param.color1 - Main Color
 * @param {String} param.color2 - Rim Color
 * @param {THREE.Vector2} [param.resolution=new THREE.Vector2(1000, 750)] - canvas' Resolution
 * @param {Pane} tweakpane - tweakpane instance
 */

export default class Flame {
    constructor(param, pane = null) {
        this.scene = param.scene
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.particleCount = param.particleCount || 100
        this.size = param.size || 1
        this.scale = param.scale || 1
        const color1 = param.color1 || 0xe38500
        const color2 = param.color2 || 0xb08100
        this.speed = param.speed || 0.5
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        
        this.color1 = new THREE.Color(color1),
        this.color2 = new THREE.Color(color2),
        this.PARTICLE_SIZE = 3.4 * this.size
        this.noiseTex = new THREE.TextureLoader().load(noise)
        this.flameTex = new THREE.TextureLoader().load(flame4)

        this.anchor
        this.create(this.scene)

        this.elapsed = 0
        this.active = false

        if (pane) this.setupGUI(pane)
    }

    create(scene) {
        /**
         * geometry
         */
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.particleCount * 3)
        const scales = new Float32Array(this.particleCount)
        const delays = new Float32Array(this.particleCount)
        const colors = new Float32Array(this.particleCount * 3)
        const mixColorRatioArr = new Float32Array(this.particleCount)

        for (let i = 0; i < this.particleCount; i++) {
            // position
            const i3 = i * 3
            positions[i3 + 0] = Math.random() * 2 - 1 // -1 ~ 1
            positions[i3 + 1] = -1
            positions[i3 + 2] = (Math.random() * 2 - 1) * 0.4 // -0.4 ~ 0.4
            // color
            mixColorRatioArr[i] = Math.random() * 0.8

            // scale
            scales[i] = 0.5 + Math.random() // 0.5 ~ 1.5
            // time
            delays[i] = Math.random() // 0 ~ 1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aMixColorRatio', new THREE.BufferAttribute(mixColorRatioArr, 1))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1))
        geometry.deleteAttribute('normal')
        geometry.deleteAttribute('uv')
        geometry.deleteAttribute('color')

        /**
         * material
         */
        const uniforms = {}
        uniforms.uTime = { value: 0 }
        uniforms.uPixelRatio = { value: this.pixelRatio }
        uniforms.uSize = { value: this.PARTICLE_SIZE }
        uniforms.uResolution = { value: this.resolution }
        uniforms.uNoiseTex = { value: this.noiseTex }
        uniforms.uFlameTex = { value: this.flameTex }
        uniforms.uColor1 = { value: this.color1 }
        uniforms.uColor2 = { value: this.color2 }

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader,
            fragmentShader,
            uniforms: uniforms,
        })

        /**
         * anchor(Points)
         */
        this.anchor = new THREE.Points(geometry, material)
        this.anchor.position.copy(this.position)
        this.anchor.scale.setScalar(this.scale)
        this.anchor.visible = false
        this.anchor.userData.state = 'off'
        scene.add(this.anchor)
    }

    resize(resolution) {
        this.resolution = resolution
        this.anchor.material.uniforms.uResolution.value.set(this.resolution.x, this.resolution.y)
    }

    activate(position=this.position) {
        this.anchor.position.copy(position)
        this.anchor.visible = true
        this.active = true
        this.elapsed = 0
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
        const folder = pane.addFolder({ title: 'Flame', expanded: false})

        folder.addButton({ title: 'Activate' }).on('click', () => { 
            if (!this.active) this.activate() 
        })

        folder.addButton({ title: 'Stop' }).on('click', () => { 
            if (this.active) this.stop() 
        })

        const sampleTextures = {
            flame1: new THREE.TextureLoader().load(flame1),
            flame2: new THREE.TextureLoader().load(flame2),
            flame3: new THREE.TextureLoader().load(flame3),
            flame4: this.flameTex,
        }

        Object.keys(sampleTextures).forEach((key) => {
            sampleTextures[key].flipY = false
        })

        folder.addBlade({
            view: 'list',
            label: 'Sample Textures',
            options: [
                { text: 'flame1', value: sampleTextures.flame1 },
                { text: 'flame2', value: sampleTextures.flame2 },
                { text: 'flame3', value: sampleTextures.flame3 },
                { text: 'flame4', value: sampleTextures.flame4 },
            ],
            value: sampleTextures.flame4,
        })
        .on('change', (value) => { this.anchor.material.uniforms.uFlameTex.value = value.value })

        folder.addBinding(
            this.anchor.material.uniforms.uColor1, 'value', 
            {color: {type: 'float'}, label: 'light color'}
        ).on('change', value => {
            this.anchor.material.uniforms.uColor1.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.anchor.material.uniforms.uColor1.value.getHexString()}`)
        })

        folder.addBinding(
            this.anchor.material.uniforms.uColor2, 
            'value', 
            {color: {type: 'float'}, label: 'dark color'}
        ).on('change', value => {
            this.anchor.material.uniforms.uColor2.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.anchor.material.uniforms.uColor2.value.getHexString()}`)
        })

        folder.addBinding(this, 'speed', {min: 0.1, max: 2})
    }

 }
