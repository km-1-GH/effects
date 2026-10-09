uniform vec3 uCenter;
uniform float uSize;

varying vec2 vUv;

// カメラに正対するビルボード
void main() {
    vec4 viewPosition = viewMatrix * vec4(uCenter, 1.0);
    viewPosition.xy += position.xy * uSize;

    gl_Position = projectionMatrix * viewPosition;

    vUv = uv;
}
