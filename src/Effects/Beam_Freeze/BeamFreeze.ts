import * as THREE from 'three'
import type { FolderApi } from 'tweakpane'
import beamVertexShader from './shader/beam/vertex.glsl'
import beamFragmentShader from './shader/beam/fragment.glsl'
import flashVertexShader from './shader/flash/vertex.glsl'
import flashFragmentShader from './shader/flash/fragment.glsl'
import freezeVertexShader from './shader/freeze/vertex.glsl'
import freezeFragmentShader from './shader/freeze/fragment.glsl'

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
    /** Beam color @default '#7fd8ff' */
    color?: string
    /** Ice film color @default '#9fe6ff' */
    iceColor?: string
    /** Ice film opacity multiplier (cracks are not affected) @default 0.75 */
    iceOpacity?: number
    /** Beam width @default 0.16 */
    width?: number
    /** Seconds to reach the target @default 0.55 */
    travelDuration?: number
    /** Freeze duration including fade out (seconds) @default 0.7 */
    freezeDuration?: number
    /** Seconds for the ice to spread from the center to the edge @default 0.08 */
    freezeSpreadDuration?: number
    /** Ice film radius relative to the target bounding sphere @default 1.15 */
    freezeRadius?: number
    /** Radial crack count (0 = none) @default 0 */
    crackCount?: number
    /** Crystal facet density @default 2 */
    crackScale?: number
    /** tweakpane folder */
    gui?: FolderApi
}

type BeamParams = Required<Pick<BeamParam,
    'color' | 'iceColor' | 'iceOpacity' | 'width' | 'travelDuration' |
    'freezeDuration' | 'freezeSpreadDuration' | 'freezeRadius' |
    'crackCount' | 'crackScale'
>>

type ShaderMesh = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>

interface Shot {
    /** 発射時刻(performance.now() のミリ秒) */
    startTime: number
    hit: boolean
    start: THREE.Vector3
    beam: ShaderMesh
    muzzleFlash: ShaderMesh
    impactFlash: ShaderMesh
    freeze: ShaderMesh
}

// beam
const TAIL_RATIO = 0.45 // 経路に対するビームの長さ
const ABSORB_DURATION = 0.1 // 到達後にビームの尾が吸い込まれる時間
// pop
const MUZZLE_DURATION = 0.2
const MUZZLE_SIZE = 0.6
const FLASH_DURATION = 0.3
const FLASH_SIZE = 1.6
// クリックとドラッグ(OrbitControls)を区別する距離(px)
const CLICK_TOLERANCE = 6

/**
 * Beam effect from mouse click position to the target.
 * The beam reaches the target and freezes it with a thin ice film.
 */
export default class BeamFreeze {
    target: THREE.Object3D
    camera: THREE.Camera
    canvas: HTMLCanvasElement
    parent: THREE.Object3D | null
    pixelRatio: number
    resolution: THREE.Vector2

    params: BeamParams

    /** false のときはクリックで撃たない */
    enabled = true

    shots: Shot[] = []

    private beamGeometry: THREE.BufferGeometry
    private flashGeometry: THREE.PlaneGeometry

    private raycaster = new THREE.Raycaster()
    private plane = new THREE.Plane()
    private pointerDown = new THREE.Vector2()
    private targetCenter = new THREE.Vector3()
    private box = new THREE.Box3()
    private sphere = new THREE.Sphere()

    constructor(param: BeamParam) {
        this.target = param.target
        this.camera = param.camera
        this.canvas = param.canvas
        this.parent = param.parent ?? null
        this.pixelRatio = param.pixelRatio ?? 1
        this.resolution = param.resolution ?? new THREE.Vector2(1000, 750)

        this.params = {
            color: param.color ?? '#7fd8ff',
            iceColor: param.iceColor ?? '#9fe6ff',
            iceOpacity: param.iceOpacity ?? 0.75,
            width: param.width ?? 0.16,
            travelDuration: Math.max(param.travelDuration ?? 0.55, 0.01),
            freezeDuration: param.freezeDuration ?? 0.7,
            freezeSpreadDuration: param.freezeSpreadDuration ?? 0.08,
            freezeRadius: param.freezeRadius ?? 1.15,
            crackCount: param.crackCount ?? 0,
            crackScale: param.crackScale ?? 2,
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
        if (!this.enabled || event.button !== 0) return
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
        const iceColor = new THREE.Color(this.params.iceColor)

        const shot: Shot = {
            startTime: performance.now(),
            hit: false,
            start: start.clone(),
            beam: this.createBeam(color),
            muzzleFlash: this.createFlash(color, MUZZLE_SIZE, MUZZLE_DURATION),
            impactFlash: this.createFlash(color, FLASH_SIZE, FLASH_DURATION),
            freeze: this.createFreeze(iceColor),
        }

        shot.muzzleFlash.material.uniforms.uCenter.value.copy(start)
        shot.muzzleFlash.visible = true

        this.shots.push(shot)
        this.update()
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

    private createEffectMaterial(
        uniforms: Record<string, THREE.IUniform>,
        vertexShader: string,
        fragmentShader: string,
        blending: THREE.Blending = THREE.AdditiveBlending,
    ) {
        // ゲームのエフェクトらしく、他の物体に隠れないように描く
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending,
            side: THREE.DoubleSide,
            uniforms,
            vertexShader,
            fragmentShader,
        })
    }

    private addEffectObject<T extends THREE.Object3D>(object: T, renderOrder = 10) {
        object.frustumCulled = false
        object.renderOrder = renderOrder
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

    private createFreeze(color: THREE.Color): ShaderMesh {
        // 白い膜でターゲットを覆いたいので通常のアルファ合成
        const material = this.createEffectMaterial({
            uCenter: { value: new THREE.Vector3() },
            uRadius: { value: 1 },
            uColor: { value: color },
            uTime: { value: 0 },
            uDuration: { value: this.params.freezeDuration },
            uSpreadDuration: { value: Math.max(this.params.freezeSpreadDuration, 0.01) },
            uCrackCount: { value: this.params.crackCount },
            uCrackScale: { value: this.params.crackScale },
            uSeed: { value: Math.random() },
            uOpacity: { value: this.params.iceOpacity },
        }, freezeVertexShader, freezeFragmentShader, THREE.NormalBlending)

        // ビームやフラッシュより奥に描く
        return this.addEffectObject(new THREE.Mesh(this.flashGeometry, material), 9)
    }

    private getTargetCenter(target: THREE.Vector3) {
        return this.box.setFromObject(this.target).getCenter(target)
    }

    /**
     * Update
     */
    update() {
        if (this.shots.length === 0) return

        // 呼び出し元のdeltaは端末や負荷でばらつくので、発射時刻からの経過時間で進める
        const now = performance.now()

        // ターゲットが動いても追従する
        const end = this.getTargetCenter(this.targetCenter)
        const radius = this.box.getBoundingSphere(this.sphere).radius
        const travel = this.params.travelDuration

        for (const shot of [...this.shots]) {
            const t = (now - shot.startTime) / 1000

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

            // Freeze: 到達した瞬間に凍りつく
            if (!shot.hit && t >= travel) {
                shot.hit = true
                shot.impactFlash.material.uniforms.uCenter.value.copy(end)
                shot.impactFlash.visible = true
                shot.freeze.visible = true
            }

            if (shot.hit) {
                const popTime = t - travel
                shot.impactFlash.material.uniforms.uTime.value = popTime
                shot.impactFlash.visible = popTime < FLASH_DURATION

                const freezeUniforms = shot.freeze.material.uniforms
                freezeUniforms.uCenter.value.copy(end)
                freezeUniforms.uRadius.value = radius * this.params.freezeRadius
                freezeUniforms.uTime.value = popTime

                if (popTime > freezeUniforms.uDuration.value) this.removeShot(shot)
            }
        }
    }

    private removeShot(shot: Shot) {
        // geometryは共有なのでmaterialだけ破棄
        for (const object of [shot.beam, shot.muzzleFlash, shot.impactFlash, shot.freeze]) {
            object.removeFromParent()
            object.material.dispose()
        }

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
        pane.addBinding(this.params, 'iceColor')
        pane.addBinding(this.params, 'iceOpacity', { min: 0, max: 3, step: 0.05 })
        pane.addBinding(this.params, 'width', { min: 0.02, max: 0.5, step: 0.01 })
        pane.addBinding(this.params, 'travelDuration', { min: 0.1, max: 2, step: 0.05 })
        pane.addBinding(this.params, 'freezeDuration', { min: 0.3, max: 5, step: 0.05 })
        pane.addBinding(this.params, 'freezeSpreadDuration', { min: 0.02, max: 1, step: 0.01 })
        pane.addBinding(this.params, 'freezeRadius', { min: 0.5, max: 2, step: 0.05 })
        pane.addBinding(this.params, 'crackCount', { min: 0, max: 20, step: 1 })
        pane.addBinding(this.params, 'crackScale', { min: 1, max: 12, step: 0.5 })
    }
}
