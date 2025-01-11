uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vTexOffset;
varying float vRadiusTheta;

#include '../../Utils/map.glsl'

void main() {
    // Define the cropping parameters
    vec2 cropSize = vec2(1.0 / 3.0); //crop size
    vec4 color = texture2D(uTexture, vec2(gl_PointCoord.x * 0.3 + vTexOffset.x, gl_PointCoord.y * (1.0 / 3.0) + vTexOffset.y));

    color.a *= 1.0 - pow(vRadiusTheta, 10.0);

    gl_FragColor = vec4(color);
}
