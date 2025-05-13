uniform sampler2D uTexture;
uniform float uTime;

varying float vDelay;
varying float vTexRotateTheta;

#include '../../Utils/map.glsl'
#include '../../Utils/rotate2D.glsl'

void main() {
    vec2 offsetedPointCoord = gl_PointCoord - vec2(0.5);

    vec2 rotatedPointCoord = rotate2D(offsetedPointCoord, vTexRotateTheta) + vec2(0.5);

    vec4 color = texture2D(uTexture, rotatedPointCoord);

    float popTime = min(1.4, max(0.0, uTime - vDelay)); // 0~1.4
    float fadeOutOpacity = clamp(map(popTime, 1.0, 1.4, 1.0, 0.0), 0.0, 1.0);
    color.a *= fadeOutOpacity;

    gl_FragColor = vec4(color);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}
