uniform sampler2D uTexture;
uniform float uTime;

varying float vDelay;

#include '../../Utils/map.glsl'

void main() {
    float fadingTime = clamp(map(mod(uTime, 3.0) - (vDelay * 1.2), 1.0, 1.5, 0.0, 1.0), 0.0, 1.0);
    vec4 color = texture2D(uTexture, gl_PointCoord);

    color.a *= 1.0 - pow(fadingTime, 2.0);
    gl_FragColor = vec4(color);
}