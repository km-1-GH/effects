uniform vec3 uColor;
uniform float uHalfWidth;
uniform float uTime;

varying vec2 vLocal;
varying float vLength;

void main() {
    // 線分(カプセル)からの距離 0: 中心 ~ 1: 外縁
    float dx = max(max(- vLocal.x, vLocal.x - vLength), 0.0);
    float d = length(vec2(dx, vLocal.y)) / uHalfWidth;
    if (d > 1.0) discard;

    // 0: tail ~ 1: head
    float along = clamp(vLocal.x / max(vLength, 0.0001), 0.0, 1.0);
    float tailFade = smoothstep(0.0, 0.7, along);
    float headBoost = 1.0 + smoothstep(0.75, 1.0, along) * 0.6;

    // 白い芯 + 色つきの光
    float core = 1.0 - smoothstep(0.1, 0.35, d);
    float glow = pow(1.0 - d, 2.0);
    float shimmer = 0.8 + 0.2 * sin(vLocal.x * 25.0 - uTime * 60.0);

    vec3 color = (uColor * glow * shimmer + vec3(1.0) * core) * headBoost;
    float alpha = clamp(glow + core, 0.0, 1.0) * tailFade;

    gl_FragColor = vec4(color, alpha);
}
