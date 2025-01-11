uniform sampler2D uTexture;
varying vec2 vTexOffset;
varying float vPopTime;

#include '../../Utils/map.glsl'

void main() {
    vec4 color = texture2D(uTexture, vec2(gl_PointCoord.x * 0.3 + vTexOffset.x, gl_PointCoord.y * (1.0 / 3.0) + vTexOffset.y));
    color.a *= 1.0 - pow(vPopTime, 6.0);

    gl_FragColor = vec4(color);
}