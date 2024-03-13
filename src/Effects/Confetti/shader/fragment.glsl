uniform sampler2D uTexture;
uniform float uTime;
uniform float uHueOffset;
uniform float uHueRange;
uniform float uSaturation;
uniform float uDuration;

varying float vRandom;
varying float vRandomByPos;

float PI = 3.14159265359;

#include '../../Utils/map.glsl'
#include '../../Utils/rotate2D.glsl'
#include '../../Utils/hsb2rgb.glsl'

void main() {
    float fadeTime = clamp(map(uTime, uDuration * 0.9, uDuration, 0.0, 1.0), 0.0, 1.0);
    vec2 offsetedPointCoord = gl_PointCoord - vec2(0.5);
    vec2 rotatedPointCoord = rotate2D(offsetedPointCoord, (uTime * vRandom) * 3.0) + vec2(0.5);
    vec4 color = texture2D(uTexture, rotatedPointCoord);

    // Color
    float hue = (vRandom * 0.5 + 0.5) * (uHueRange / 1.0) + uHueOffset;
    color.rgb *= hsb2rgb(vec3(hue, uSaturation, 1.0));

    color.a *= 1.0 - fadeTime;

    gl_FragColor = vec4(color);
}