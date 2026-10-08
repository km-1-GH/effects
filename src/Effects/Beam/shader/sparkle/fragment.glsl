uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vAlpha;
varying float vRandom;
varying float vRotation;

#include '../../../Utils/rotate2D.glsl'

void main() {
    vec2 uv = rotate2D(gl_PointCoord - vec2(0.5), vRotation);

    // 4方向に尖ったキラキラ星 (sqrt|x| + sqrt|y| = r)
    float shape = sqrt(abs(uv.x)) + sqrt(abs(uv.y));
    float star = 1.0 - smoothstep(0.62, 0.7, shape);
    float glow = exp(- length(uv) * 10.0) * 0.6;

    // 中心は白、先端に向かって色づく
    vec3 tint = mix(uColorA, uColorB, step(0.5, vRandom));
    vec3 color = mix(vec3(1.0), tint, smoothstep(0.25, 0.6, shape));

    float alpha = clamp(star + glow, 0.0, 1.0) * vAlpha;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
}
