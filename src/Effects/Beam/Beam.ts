import * as THREE from 'three'
import type { FolderApi } from 'tweakpane'
import beamVertexShader from './shader/beam/vertex.glsl'
import beamFragmentShader from './shader/beam/fragment.glsl'
import flashVertexShader from './shader/flash/vertex.glsl'
import flashFragmentShader from './shader/flash/fragment.glsl'
import sparkleVertexShader from './shader/sparkle/vertex.glsl'
import sparkleFragmentShader from './shader/sparkle/fragment.glsl'

export interface BeamParam {
    /** The target object for the beam effect */
    target: THREE.Object3D
    /** Camera used to convert the click position */
    camera: THREE.Camera
    /** Canvas to listen click events */
    canvas: HTMLCanvasElement
    /** Parent object to add effects to @default null */
    parent?: THREE.Object3D | null
    /** window.devicePixelRatio @default 1 */
    pixelRatio?: number
    /** THREE canvas resolution @default new THREE.Vector2(1000, 750) */
    resolution?: THREE.Vector2
    /** Beam color @default '#ffd84d' */
    color?: string
    /** Second sparkle color @default '#7fe3ff' */
    sparkleColor?: string
    /** Beam width @default 0.16 */
    width?: number
    /** Seconds to reach the target @default 0.4 */
    travelDuration?: number
    /** Sparkle count @default 14 */
    sparkleCount?: number
    /** Sparkle duration (seconds) @default 0.6 */
    sparkleDuration?: number
    /** Sparkle size @default 0.8 */
    sparkleSize?: number
    /** Sparkle spread @default 1.8 */
    sparkleSpread?: number
    /** Sparkle gravity @default 1 */
    sparkleGravity?: number
    /** tweakpane folder */
    gui?: FolderApi
}

type BeamParams = Required<Pick<BeamParam,
    'color' | 'sparkleColor' | 'width' | 'travelDuration' |
    'sparkleCount' | 'sparkleDuration' | 'sparkleSize' |
    'sparkleSpread' | 'sparkleGravity'
>>

type ShaderMesh = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
type ShaderPoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>

interface Shot {
    elapsed: number
    hit: boolean
    start: THREE.Vector3
    beam: ShaderMesh
    muzzleFlash: ShaderMesh
    impactFlash: ShaderMesh
    sparkles: ShaderPoints
}

// beam
const TAIL_RATIO = 0.45 // 経路に対するビームの長さ
const ABSORB_DURATION = 0.1 // 到達後にビームの尾が吸い込まれる時間
// pop
const MUZZLE_DURATION = 0.2
const MUZZLE_SIZE = 0.6
const FLASH_DURATION = 0.3
const FLASH_SIZE = 1.6
// sparkles
const SPARKLE_MAX_DELAY = 0.06
// クリックとドラッグ(OrbitControls)を区別する距離(px)
const CLICK_TOLERANCE = 6

/**
 * Beam effect from mouse click position to the target.
 * The beam reaches the target, pops, and scatters sparkles.
 */
export default class Beam {
    target: THREE.Object3D
    camera: THREE.Camera
    canvas: HTMLCanvasElement
    parent: THREE.Object3D | null
    pixelRatio: number
    resolution: THREE.Vector2

    params: BeamParams
    
    shots: Shot[] = []

    private beamGeometry: THREE.BufferGeometry
    private flashGeometry: THREE.PlaneGeometry

    private raycaster = new THREE.Raycaster()
    private plane = new THREE.Plane()
    private pointerDown = new THREE.Vector2()
    private targetCenter = new THREE.Vector3()
    private box = new THREE.Box3()

    constructor(param: BeamParam) {
        this.target = param.target
        this.camera = param.camera
        this.canvas = param.canvas
        this.parent = param.parent ?? null
        this.pixelRatio = param.pixelRatio ?? 1
        this.resolution = param.resolution ?? new THREE.Vector2(1000, 750)

        this.params = {
            color: param.color ?? '#ffd84d',
            sparkleColor: param.sparkleColor ?? '#7fe3ff',
            width: param.width ?? 0.16,
            travelDuration: Math.max(param.travelDuration ?? 0.4, 0.01),
            sparkleCount: param.sparkleCount ?? 14,
            sparkleDuration: param.sparkleDuration ?? 0.6,
            sparkleSize: param.sparkleSize ?? 0.8,
            sparkleSpread: param.sparkleSpread ?? 1.8,
            sparkleGravity: param.sparkleGravity ?? 1,
        }

        this.beamGeometry = this.createBeamGeometry()
        this.flashGeometry = new THREE.PlaneGeometry(1, 1)

        this.canvas.addEventListener('pointerdown', this.onPointerDown)
        this.canvas.addEventListener('pointerup', this.onPointerUp)

        if (param.gui) this.setupGUI(param.gui)
    }

    resize(resolution: THREE.Vector2) {
        this.resolution.set(resolution.x, resolution.y)
    }

    /**
     * Events
     */
    private onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return
        this.pointerDown.set(event.clientX, event.clientY)
    }

    private onPointerUp = (event: PointerEvent) => {
        if (event.button !== 0) return
        // ドラッグ(カメラ操作)のときは撃たない
        if (this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > CLICK_TOLERANCE) return
        this.fireFromScreen(event.clientX, event.clientY)
    }

    /**
     * 画面上の座標からビームを撃つ
     * 開始位置はクリックした方向のレイと、ターゲット中心を通りカメラに正対する平面との交点
     */
    fireFromScreen(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect()
        const ndc = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            - ((clientY - rect.top) / rect.height) * 2 + 1,
        )
        this.raycaster.setFromCamera(ndc, this.camera)

        const normal = this.camera.getWorldDirection(new THREE.Vector3())
        this.plane.setFromNormalAndCoplanarPoint(normal, this.getTargetCenter(this.targetCenter))

        const start = new THREE.Vector3()
        if (!this.raycaster.ray.intersectPlane(this.plane, start)) return

        this.fire(start)
    }

    fire(start: THREE.Vector3) {
        const color = new THREE.Color(this.params.color)
        const sparkleColor = new THREE.Color(this.params.sparkleColor)

        const shot: Shot = {
            elapsed: 0,
            hit: false,
            start: start.clone(),
            beam: this.createBeam(color),
            muzzleFlash: this.createFlash(color, MUZZLE_SIZE, MUZZLE_DURATION),
            impactFlash: this.createFlash(color, FLASH_SIZE, FLASH_DURATION),
            sparkles: this.createSparkles(color, sparkleColor),
        }

        shot.muzzleFlash.material.uniforms.uCenter.value.copy(start)
        shot.muzzleFlash.visible = true

        this.shots.push(shot)
        this.update(0)
    }

    /**
     * Create
     */
    private createBeamGeometry() {
        // x: 0 = tail, 1 = head / y: -1 ~ 1 = side
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            0, -1, 0,
            0,  1, 0,
            1, -1, 0,
            1,  1, 0,
        ]), 3))
        geometry.setIndex([0, 2, 1, 1, 2, 3])
        return geometry
    }

    private createEffectMaterial(uniforms: Record<string, THREE.IUniform>, vertexShader: string, fragmentShader: string) {
        // ゲームのエフェクトらしく、加算合成で他の物体に隠れないように描く
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms,
            vertexShader,
            fragmentShader,
        })
    }

    private addEffectObject<T extends THREE.Object3D>(object: T) {
        object.frustumCulled = false
        object.renderOrder = 10
        object.visible = false
        if (this.parent) this.parent.add(object)
        return object
    }

    private createBeam(color: THREE.Color): ShaderMesh {
        const material = this.createEffectMaterial({
            uTail: { value: new THREE.Vector3() },
            uHead: { value: new THREE.Vector3() },
            uHalfWidth: { value: this.params.width * 0.5 },
            uColor: { value: color },
            uTime: { value: 0 },
        }, beamVertexShader, beamFragmentShader)

        return this.addEffectObject(new THREE.Mesh(this.beamGeometry, material))
    }

    private createFlash(color: THREE.Color, size: number, duration: number): ShaderMesh {
        const material = this.createEffectMaterial({
            uCenter: { value: new THREE.Vector3() },
            uSize: { value: size },
            uColor: { value: color },
            uTime: { value: 0 },
            uDuration: { value: duration },
        }, flashVertexShader, flashFragmentShader)

        return this.addEffectObject(new THREE.Mesh(this.flashGeometry, material))
    }

    private createSparkles(colorA: THREE.Color, colorB: THREE.Color): ShaderPoints {
        const count = this.params.sparkleCount
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        const angles = new Float32Array(count)
        const speeds = new Float32Array(count)
        const scales = new Float32Array(count)
        const random = new Float32Array(count)
        const delays = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            // 均等に散らしつつ少しばらつかせる
            angles[i] = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / count)
            speeds[i] = this.params.sparkleSpread * (0.5 + Math.random() * 0.5) // 0.5 ~ 1
            scales[i] = 0.5 + Math.random() * 0.5 // 0.5 ~ 1
            random[i] = Math.random()
            delays[i] = Math.random() * SPARKLE_MAX_DELAY
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1))
        geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(random, 1))
        geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1))

        const material = this.createEffectMaterial({
            uCenter: { value: new THREE.Vector3() },
            uRight: { value: new THREE.Vector3(1, 0, 0) },
            uUp: { value: new THREE.Vector3(0, 1, 0) },
            uResolution: { value: this.resolution },
            uSize: { value: this.params.sparkleSize * this.pixelRatio },
            uTime: { value: 0 },
            uDuration: { value: this.params.sparkleDuration },
            uGravity: { value: this.params.sparkleGravity },
            uColorA: { value: colorA },
            uColorB: { value: colorB },
        }, sparkleVertexShader, sparkleFragmentShader)

        return this.addEffectObject(new THREE.Points(geometry, material))
    }

    private getTargetCenter(target: THREE.Vector3) {
        return this.box.setFromObject(this.target).getCenter(target)
    }

    /**
     * Update
     */
    update(delta: number) {
        if (this.shots.length === 0) return

        // ターゲットが動いても追従する
        const end = this.getTargetCenter(this.targetCenter)
        const travel = this.params.travelDuration

        for (const shot of [...this.shots]) {
            shot.elapsed += delta
            const t = shot.elapsed

            // Beam: 加速しながら飛んで、到達後は尾が吸い込まれる
            const progress = Math.min(t / travel, 1)
            const head = 1 - Math.cos(progress * Math.PI * 0.5) // easeInSine
            const absorb = THREE.MathUtils.clamp((t - travel) / ABSORB_DURATION, 0, 1)
            const tail = progress < 1
                ? Math.max(0, head - TAIL_RATIO)
                : THREE.MathUtils.lerp(1 - TAIL_RATIO, 1, absorb)

            const beamUniforms = shot.beam.material.uniforms
            beamUniforms.uHead.value.lerpVectors(shot.start, end, head)
            beamUniforms.uTail.value.lerpVectors(shot.start, end, tail)
            beamUniforms.uTime.value = t
            shot.beam.visible = absorb < 1

            // Muzzle flash
            shot.muzzleFlash.material.uniforms.uTime.value = t
            shot.muzzleFlash.visible = t < MUZZLE_DURATION

            // Pop: 到達した瞬間にはじける
            if (!shot.hit && t >= travel) {
                shot.hit = true
                shot.impactFlash.material.uniforms.uCenter.value.copy(end)
                shot.impactFlash.visible = true

                const sparkleUniforms = shot.sparkles.material.uniforms
                sparkleUniforms.uCenter.value.copy(end)
                sparkleUniforms.uRight.value.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize()
                sparkleUniforms.uUp.value.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize()
                shot.sparkles.visible = true
            }

            if (shot.hit) {
                const popTime = t - travel
                shot.impactFlash.material.uniforms.uTime.value = popTime
                shot.impactFlash.visible = popTime < FLASH_DURATION
                shot.sparkles.material.uniforms.uTime.value = popTime

                if (popTime > this.params.sparkleDuration + SPARKLE_MAX_DELAY) this.removeShot(shot)
            }
        }
    }

    private removeShot(shot: Shot) {
        for (const object of [shot.beam, shot.muzzleFlash, shot.impactFlash, shot.sparkles]) {
            object.removeFromParent()
            object.material.dispose()
        }
        // beam / flash のgeometryは共有なのでsparklesだけ破棄
        shot.sparkles.geometry.dispose()

        this.shots.splice(this.shots.indexOf(shot), 1)
    }

    dispose() {
        this.canvas.removeEventListener('pointerdown', this.onPointerDown)
        this.canvas.removeEventListener('pointerup', this.onPointerUp)
        for (const shot of [...this.shots]) this.removeShot(shot)
        this.beamGeometry.dispose()
        this.flashGeometry.dispose()
    }

    /**
     * GUI
     */
    setupGUI(pane: FolderApi) {
        pane.addButton({ title: 'Fire (random)' }).on('click', () => {
            const rect = this.canvas.getBoundingClientRect()
            this.fireFromScreen(
                rect.left + rect.width * (0.1 + Math.random() * 0.8),
                rect.top + rect.height * (0.1 + Math.random() * 0.8),
            )
        })

        pane.addBinding(this.params, 'color')
        pane.addBinding(this.params, 'sparkleColor')
        pane.addBinding(this.params, 'width', { min: 0.02, max: 0.5, step: 0.01 })
        pane.addBinding(this.params, 'travelDuration', { min: 0.1, max: 2, step: 0.05 })
        pane.addBinding(this.params, 'sparkleCount', { min: 4, max: 40, step: 1 })
        pane.addBinding(this.params, 'sparkleDuration', { min: 0.1, max: 7, step: 0.05 })
        pane.addBinding(this.params, 'sparkleSize', { min: 0.1, max: 2, step: 0.05 })
        pane.addBinding(this.params, 'sparkleSpread', { min: 0.1, max: 5, step: 0.1 })
        pane.addBinding(this.params, 'sparkleGravity', { min: -1, max: 5, step: 0.1 })
    }
}
