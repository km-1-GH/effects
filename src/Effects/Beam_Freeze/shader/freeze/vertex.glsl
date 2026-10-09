uniform vec3 uCenter;
uniform float uRadius;

varying vec2 vUv;

// ターゲットの手前に張る、カメラに正対した円形の膜
void main() {
    vec4 viewPosition = viewMatrix * vec4(uCenter, 1.0);
    // ターゲットを包む球の前面まで手前に出す
    viewPosition.z += uRadius;
    viewPosition.xy += position.xy * 2.0 * uRadius;

    gl_Position = projectionMatrix * viewPosition;

    vUv = uv;
}
