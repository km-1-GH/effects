uniform vec3 uColor;
uniform float uTime;
uniform float uDuration;
uniform float uSpreadDuration;
uniform float uCrackCount;
uniform float uCrackScale;
uniform float uSeed;
uniform float uOpacity;

varying vec2 vUv;

float PI = 3.1415926535897932384626433832795;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// x: セルの境界までの距離, y: セルごとの乱数
vec2 voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec2 mg;
    vec2 mr;
    float md = 8.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 r = g + hash2(n + g) - f;
            float d = dot(r, r);
            if (d < md) {
                md = d;
                mr = r;
                mg = g;
            }
        }
    }

    md = 8.0;
    for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
            vec2 g = mg + vec2(float(i), float(j));
            vec2 r = g + hash2(n + g) - f;
            if (dot(mr - r, mr - r) > 0.00001) {
                md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
            }
        }
    }

    return vec2(md, hash(n + mg));
}

void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);
    if (d > 1.0) discard;

    /**
     * 中心から外側へピシッと走る凍結の前線
     */
    float spread = clamp(uTime / uSpreadDuration, 0.0, 1.0);
    float front = (1.0 - pow(1.0 - spread, 3.0)) * 1.1;
    float frozen = 1.0 - smoothstep(front - 0.08, front, d);
    if (frozen <= 0.0) discard;

    // 凍りきった瞬間に一瞬白く光る
    float snap = (1.0 - smoothstep(0.0, 0.2, uTime - uSpreadDuration)) * spread;
    // 前線の光の帯
    float bandDistance = (d - front) / 0.05;
    float band = exp(- bandDistance * bandDistance) * (1.0 - spread * 0.5);

    /**
     * Ice
     */
    vec2 seedOffset = vec2(uSeed * 17.0, uSeed * 31.0);

    // 霜のざらつき
    float frost = noise(p * 12.0 + seedOffset) * 0.6 + noise(p * 35.0 - seedOffset) * 0.4;

    // 結晶の面 (voronoi)
    vec2 cell = voronoi(p * uCrackScale + seedOffset);
    float facet = 1.0 - smoothstep(0.0, 0.04, cell.x);

    // 中心から放射状に走るヒビ (uCrackCount = 0 で無効)
    float crack = 0.0;
    float count = floor(uCrackCount);
    if (count >= 1.0) {
        float a = atan(p.y, p.x) / (PI * 2.0) * count;
        float id = mod(floor(a + 0.5), count);
        float wobble = (noise(vec2(d * 6.0, id * 3.7 + uSeed * 10.0)) - 0.5) * 0.35;
        float arc = abs(fract(a + wobble + 0.5) - 0.5) * (PI * 2.0 / count) * d;
        float crackLength = 0.45 + 0.55 * hash(vec2(id, uSeed));
        float crackWidth = 0.012 * (1.0 - d / crackLength * 0.7);
        crack = (1.0 - smoothstep(0.0, crackWidth, arc)) * step(d, crackLength);
    }

    // 縁は厚みのある氷のように明るく
    float rim = smoothstep(0.85, 0.99, d);
    float edge = 1.0 - smoothstep(0.985, 1.0, d);

    // ガラスのような斜めの映り込み
    float diagonal = dot(p, vec2(0.7071));
    float sheen = (1.0 - smoothstep(0.0, 0.1, abs(diagonal - 0.35))) * 0.12
                + (1.0 - smoothstep(0.0, 0.03, abs(diagonal - 0.55))) * 0.1;

    /**
     * Fade: セル単位で砕けるように消える
     */
    float fadeStart = max(uSpreadDuration, uDuration * 0.55);
    float fade = clamp((uTime - fadeStart) / max(uDuration - fadeStart, 0.0001), 0.0, 1.0);
    float cellFade = 1.0 - smoothstep(cell.y * 0.7, cell.y * 0.7 + 0.3, fade);

    float white = clamp(crack + facet * 0.5 + band + rim * 0.6 + sheen + snap * 0.5, 0.0, 1.0);
    vec3 color = mix(uColor, vec3(1.0), white);

    float film = (0.2 + frost * 0.15 + rim * 0.35 + facet * 0.25) * uOpacity;
    float alpha = film + crack * 0.8 + band + sheen + snap * 0.3;
    alpha = clamp(alpha, 0.0, 1.0) * frozen * edge * cellFade;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
}
