import * as THREE from 'three'
import vertexShader from './shader/vertex.glsl'
import fragmentShader from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module SmokeParticle
 * @param {Object} [param] - Parameters
 * @param {THREE.Scene | THREE.Mesh} [param.parent] - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector2} [param.resolution] - THREE canvas Resolution
 * @param {THREE.Vector3} [param.position] - default Position
 * @param {number} [param.scale] - Mesh Scale
 * @param {number} [param.speed] - Animation Speed
 * @param {number} [param.size] - Particle Size Scale
 * @param {String} [param.color1] - Main Color
 * @param {String} [param.color2] - Rim Color
 * @param {Pane} [param.gui] - tweakpane instance
 */
export default class SmokeParticle {
    constructor(param) {
        this.parent = param.parent || null
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.scale = param.scale || 1
        this.speed = param.speed || 1
        this.size = param.size || 1
        const color1 = param.color1 || 0xf7feff
        const color2 = param.color2 || 0xf8f8f8
        
        this.noiseTex = new THREE.TextureLoader().load(noise)
        this.noiseTex.wrapS = this.noiseTex.wrapT = THREE.RepeatWrapping
        this.PARTICLE_SIZE = 4 * this.size * this.pixelRatio

        this.uniforms = {
            uSize: { value: this.PARTICLE_SIZE },
            uMeshScale: { value: this.scale || 1 },
            uTime: { value: 0 },
            uResolution: { value: param.resolution || new THREE.Vector2(1000, 750) },
            uNoiseTex: { value: this.noiseTex },
            uColor1: { value: new THREE.Color(color1) },
            uColor2: { value: new THREE.Color(color2) },
        }

        this.object = this.create()

        this.elapsed = 0

        if (param.gui) this.setupGUI(param.gui)
    }

    resize(resolution) {
        this.uniforms.uResolution.value.set(resolution.x, resolution.y)
    }

    create() {
        /**
         * geometry
         */
        const SMALL_R = 0.1
        const MEDIUM_R = 0.3
        const LARGE_R = 0.36
        const SMALL_COUNT = 11
        const MEDIUM_COUNT = 31
        const LARGE_COUNT = 41

        const paramArr = []

        for (let i = 0; i < SMALL_COUNT; i++) {
            const vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
            const position = vector.clone().multiplyScalar(SMALL_R)
            paramArr.push(position)
        }

        for (let i = 0; i < MEDIUM_COUNT; i++) {
            const vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
            const position = vector.clone().multiplyScalar(MEDIUM_R)
            paramArr.push(position)
        }

        for (let i = 0; i < LARGE_COUNT; i++) {
            const vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
            const position = vector.clone().multiplyScalar(LARGE_R)
            paramArr.push(position)
        }

        const PARTICLE_COUNT = paramArr.length

        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(PARTICLE_COUNT * 3)
        const scale = new Float32Array(PARTICLE_COUNT)
        const delay = new Float32Array(PARTICLE_COUNT)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // position
            const index = i * 3
            positions[index] = paramArr[i].x
            positions[index + 1] = paramArr[i].y
            positions[index + 2] = paramArr[i].z

            // scale and delay
            scale[i] = Math.random() * 0.4 + 0.6 // 0.6 ~ 1.0
            delay[i] = Math.random() * 0.8
        }

        geometry.setAttribute('position', new THREE.BufferAttribute( positions, 3))
        geometry.setAttribute('aScale', new THREE.BufferAttribute( scale, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute( delay, 1))

        /**
         * material
         */
        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader,
        })

        /**
         * object(Points)
         */
        const object = new THREE.Points(geometry, material)
        object.position.copy(this.position)
        object.visible = false
        this.state = 'off'

        if (this.parent) this.parent.add(object)

        return object
    }

    activate(position=this.position, addScale=0, speed=this.speed) {
        this.object.position.set(position.x, position.y, position.z)
        this.object.rotation.z = Math.random() * Math.PI * 2
        this.object.scale.setScalar(this.scale + addScale)
        this.uniforms.uMeshScale.value = this.scale + addScale
        this.speed = speed

        this.elapsed = 0
        this.state = 'on'
        this.object.visible = true
    }

    update(delta) {
        if (this.state !== 'on') return ////////////

        this.elapsed += delta * 0.5 * this.speed
        this.uniforms.uTime.value = this.elapsed

        if (this.elapsed >= 1) {
            this.elapsed = 0
            this.state = 'done'
            this.object.visible = false  ////////////////////
            return
        }
    }

    setupGUI(pane) {
        pane.addButton({ title: 'Activate' }).on('click', () => { 
            if (this.state !== 'on') this.activate() 
        })

        const tabs = pane.addTab({ pages: [ { title: 'Mesh'}, {title: 'Shader'} ] })
        const MeshParam = tabs.pages[0]
        const ShaderParam = tabs.pages[1]

        MeshParam.addBinding(this, 'scale', { min: 0.1, max: 10 })

        MeshParam.addBinding(this, 'speed', { min: 0.3, max: 2 })

        ShaderParam.addBinding(this, 'size', { min: 0.8, max: 1.5 })
            .on('change', () => { this.uniforms.uSize.value = this.PARTICLE_SIZE * this.size * this.pixelRatio })

        ShaderParam.addBinding(
            this.uniforms.uColor1, 'value', 
            {color: {type: 'float'}, label: 'Main color'}
        ).on('change', value => {
            this.uniforms.uColor1.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.uniforms.uColor1.value.getHexString()}`)
        })

        ShaderParam.addBinding(
            this.uniforms.uColor2, 
            'value', 
            {color: {type: 'float'}, label: 'Rim color'}
        ).on('change', value => {
            this.uniforms.uColor2.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.uniforms.uColor2.value.getHexString()}`)
        })
    }
 }
