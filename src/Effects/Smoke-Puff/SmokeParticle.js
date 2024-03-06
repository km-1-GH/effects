import * as THREE from 'three'
import particleVertex from './shader/vertex.glsl'
import particleFragment from './shader/fragment.glsl'
import noise from '/perlin.png'

/**
 * @module SmokeParticle
 * @param {Object} param - Particle Parameters
 * @param {THREE.Scene} param.scene - Parent Mesh to add
 * @param {number} [param.pixelRatio] - window.devicePixelRatio
 * @param {THREE.Vector3} [param.position] - default Position
* @param {number} [param.speed] - Animation Speed
 * @param {number} [param.size] - Particle Size Scale
 * @param {number} [param.scale] - Mesh Destination Scale
 * @param {String} [param.color1] - Main Color
 * @param {String} [param.color2] - Rim Color
 * @param {THREE.Texture} [param.noise] - Noise Texture
 * @param {THREE.Vector2} [param.resolution] - Resolution
 * @param {Pane} [tweakpane] - tweakpane instance
 */
export default class SmokeParticle {
    constructor(param, pane=null) {
        this.scene = param.scene
        this.pixelRatio = param.pixelRatio || 1
        this.position = param.position || new THREE.Vector3(0, 0, 0)
        this.speed = param.speed || 1
        this.size = param.size || 1
        this.destScale = param.scale || 1
        const color1 = param.color1 || 0xf7feff
        const color2 = param.color2 || 0xf8f8f8
        this.noiseTex = param.noise || new THREE.TextureLoader().load(noise)
        this.resolution = param.resolution || new THREE.Vector2(1000, 750)
        
        this.colors = [
            new THREE.Color(color1),
            new THREE.Color(color2),
        ]
        this.PARTICLE_SIZE = 1 * param.size

        this.anchor
        this.create(this.scene)

        this.elapsed = 0

        if (pane) this.setupGUI(pane)
    }

    create(scene) {
        /**
         * geometry
         */
        const SMALL_R = 0.05
        const MEDIUM_R = 0.15
        const LARGE_R = 0.18
        const SMALL_COUNT = 20
        const MEDIUM_COUNT = 24
        const LARGE_COUNT = 32

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
            scale[i] = Math.random() * 0.6 + 0.4 // 0.4 ~ 1.0
            delay[i] = Math.random() * 0.8
        }

        geometry.setAttribute('position', new THREE.BufferAttribute( positions, 3))
        geometry.setAttribute('aScale', new THREE.BufferAttribute( scale, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute( delay, 1))

        /**
         * material
         */
        const uniforms = {}
        uniforms.uSize = { value: this.PARTICLE_SIZE * this.pixelRatio }
        uniforms.uMeshScale = { value: 1 }
        uniforms.uTime = { value: 0 }
        uniforms.uResolution = { value: this.resolution }
        uniforms.uTexture = { value: this.noiseTex }
        for (let i = 0; i < this.colors.length; i++) {
            uniforms[`uColor${i + 1}`] = { value: this.colors[i] }
        }

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            vertexColors: true,
            vertexShader: particleVertex,
            fragmentShader: particleFragment,
            uniforms: uniforms,
        })

        /**
         * anchor(Points)
         */
        this.anchor = new THREE.Points(geometry, material)
        this.anchor.position.copy(this.position)
        this.anchor.visible = false  /////////////
        this.anchor.userData.state = 'off'
        scene.add(this.anchor)
    }

    resize(resolution) {
        this.resolution = resolution
        this.anchor.material.uniforms.uResolution.value.set(this.resolution.x, this.resolution.y)
    }

    activate(position=this.position, addScale=0, speed=this.speed) {
        this.anchor.position.set(position.x, position.y, position.z)
        this.anchor.rotation.z = Math.random() * Math.PI * 2
        this.anchor.scale.setScalar(this.destScale + addScale)
        this.anchor.material.uniforms.uMeshScale.value = this.destScale + addScale
        this.speed = speed

        this.elapsed = 0
        this.anchor.userData.state = 'on'
        this.anchor.visible = true
    }

    update(delta) {
        if (this.anchor.userData.state !== 'on') return ////////////

        this.elapsed += delta * 0.5 * this.speed
        this.anchor.material.uniforms.uTime.value = this.elapsed

        if (this.elapsed >= 1) {
            this.elapsed = 0
            this.anchor.userData.state = 'done'
            this.anchor.visible = false  ////////////////////
            return
        }
    }

    setupGUI(pane) {
        const folder = pane.addFolder({ title: 'Smoke Puff', expanded: false})

        folder.addButton({ title: 'Activate' }).on('click', () => { 
            if (this.anchor.userData.state !== 'on') this.activate() 
        })

        folder.addBinding(this, 'destScale', { min: 0, max: 10 })

        folder.addBinding(this, 'speed', { min: 0, max: 5 })

        folder.addBinding(this, 'size', { min: 0, max: 10 })
        .on('change', value => { this.anchor.material.uniforms.uSize.value = this.PARTICLE_SIZE * value.value })

        folder.addBinding(
            this.anchor.material.uniforms.uColor1, 'value', 
            {color: {type: 'float'}, label: 'Main color'}
        ).on('change', value => {
            this.anchor.material.uniforms.uColor1.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.anchor.material.uniforms.uColor1.value.getHexString()}`)
        })

        folder.addBinding(
            this.anchor.material.uniforms.uColor2, 
            'value', 
            {color: {type: 'float'}, label: 'Rim color'}
        ).on('change', value => {
            this.anchor.material.uniforms.uColor2.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
            .convertLinearToSRGB()
            console.log(`0x${this.anchor.material.uniforms.uColor2.value.getHexString()}`)
        })
    }
 }
