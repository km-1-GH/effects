uniform sampler2D uTexture;
uniform float uTime;

varying float vDelay;

float PI = 3.14159265359;

#include '../../Utils/map.glsl'
#include '../../Utils/rotate2D.glsl'

void main() {
    vec2 offsetedPointCoord = gl_PointCoord - vec2(0.5);
    vec2 rotatedPointCoord = rotate2D(offsetedPointCoord, (uTime * vDelay) * 3.0) + vec2(0.5);
    vec4 color = texture2D(uTexture, rotatedPointCoord);

    gl_FragColor = vec4(color);
}