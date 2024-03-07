uniform float uTime;
uniform sampler2D uFlameTex;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying float vDelay;
varying float vPositionX; // -1~1
varying float vPositionY; // -1 + 0~4 = -1~3
varying float vMixColorRatio;

#include ../../Utils/map.glsl

void main() {
    float dissapearTime = clamp(map(uTime + vDelay * 0.5, 0.5, 1.0, 0.0, 1.0), 0.0, 1.0);
    float opacity = 1.0 - dissapearTime;
    opacity *= texture2D(uFlameTex, gl_PointCoord).r;

    float center = 1.0 - clamp(distance(vPositionX, 0.0) / 1.2, 0.0, 1.0);
    center *= 1.0 - clamp(distance(vPositionY, -1.0) / 3.0, 0.0, 1.0);
    center *= 0.1;

    vec3 mixedColor = mix(uColor1, uColor2, vMixColorRatio);
    vec3 smokeColor = vec3(1.0);
    mixedColor = mix(mixedColor, smokeColor, smoothstep(0.5, 1.0, dissapearTime));

    
    gl_FragColor = vec4(mixedColor + center, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}