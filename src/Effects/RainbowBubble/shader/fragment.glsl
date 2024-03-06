uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

float PI = 3.14159265359;

#include ../../Utils/atan2.glsl
#include ../../Utils/hsb2rgb.glsl

void main() {
    vec3 normalizedNormal = normalize(vNormal);
    if (!gl_FrontFacing)
        normalizedNormal = -normalizedNormal;

    // Fresnel
    vec3 viewVector = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewVector, normalizedNormal)), 2.0);

    // Emission
    float emissionTime = pow(mod(uTime, 5.0), 2.0); 
    float offsetX = (normalizedNormal.x * 0.5 + 0.5) * 0.4; // 0~0.2
    float emission = 1.0 - distance(normalizedNormal.y * 0.5 + 0.5, emissionTime + offsetX) * 2.0; // 0~1
    emission = smoothstep(0.7, 1.0, emission) * 0.5;

    // Color
    vec3 rainbow = hsb2rgb(vec3(
        (vPosition.y + vPosition.x - uTime * 0.1) * (1.0 / PI),
        0.8,
        1.0
    ));
    vec4 finalColor = vec4(rainbow, fresnel + emission);

    if (finalColor.a < 0.001) discard;
    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}