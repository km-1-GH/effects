uniform vec3 uColor;
uniform float uTime;
uniform float uDuration;

varying vec2 vUv;

float PI = 3.1415926535897932384626433832795;

void main() {
    float t = clamp(uTime / uDuration, 0.0, 1.0);
    float d = length(vUv - 0.5) * 2.0;
    float fade = 1.0 - t;

    // ポンっと一気に膨らむ光の玉
    float bloomRadius = 0.45 * sin(min(t * 3.0, 1.0) * PI * 0.5) + 0.001;
    float bloom = (1.0 - smoothstep(0.0, bloomRadius, d)) * fade * fade;

    // 外へ広がるリング
    float ringRadius = (1.0 - pow(1.0 - t, 3.0)) * 0.85;
    float ring = (1.0 - smoothstep(0.0, 0.1, abs(d - ringRadius))) * fade;

    vec3 color = mix(uColor, vec3(1.0), bloom);
    float alpha = clamp(ring * 0.8 + bloom, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
}
