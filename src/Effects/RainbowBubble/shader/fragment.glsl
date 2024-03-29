uniform float uTime;
uniform float uPopTime;
uniform sampler2D uNoiseTex;
uniform float uHueOffset;
uniform float uHueRange;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

float PI = 3.14159265358;

#include ../../Utils/atan2.glsl
#include ../../Utils/hsb2rgb.glsl

void main() {
    vec3 normalizedNormal = normalize(vNormal);
    if (!gl_FrontFacing)
        normalizedNormal = -normalizedNormal;

    float alpha = 1.0;
    // Fresnel
    vec3 viewVector = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewVector, normalizedNormal)), 2.0);
    alpha *= fresnel;

    // Emission
    float emissionTime = pow(mod(uTime, 5.0), 2.0); 
    float offsetX = (normalizedNormal.x * 0.5 + 0.5) * 0.4; // 0~0.2
    float emission = 1.0 - distance(normalizedNormal.y * 0.5 + 0.5, emissionTime + offsetX) * 2.0; // 0~1
    emission = smoothstep(0.7, 1.0, emission) * 0.5;
    alpha += emission;

    // Color
    float hue = texture(uNoiseTex, vUv).r;
    vec3 rainbow = hsb2rgb(vec3(
        uHueOffset + sin(hue + uTime * 0.2) * uHueRange,
        0.8,
        1.0
    ));

    // Pop
    vec4 finalColor = vec4(rainbow, alpha - uPopTime);

    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}