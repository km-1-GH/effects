uniform float uTime;
uniform float uPopSpeed;
uniform float uPopTime;
uniform sampler2D uNoiseTex;
uniform float uSaturation;
uniform float uHueOffset;
uniform float uHueRange;
uniform float uPopNoiseFrequency;

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

    // Emission
    float emissionTime = pow(mod(uTime, 5.0), 2.0); 
    float offsetX = (normalizedNormal.x * 0.5 + 0.5) * 0.4; // 0~0.2
    float emission = 1.0 - distance(normalizedNormal.y * 0.5 + 0.5, emissionTime + offsetX) * 2.0; // 0~1
    emission = smoothstep(0.7, 1.0, emission) * 0.5;

    // Color
    float hue = texture(uNoiseTex, vUv).r;
    vec3 rainbow = hsb2rgb(vec3(
        uHueOffset + sin(hue + uTime * 0.2) * uHueRange,
        uSaturation,
        1.0
    ));

    // Pop
    float popNoise = texture2D(uNoiseTex, vec2(vUv.x, vUv.y) * uPopNoiseFrequency).r;
    float popSubAlpha = smoothstep(0.45, 0.5, popNoise);

    float disableEmission = uPopTime > 0.0 ? 0.0 : 1.0;
    float popStarted = uPopTime > 0.0 ? 1.0 : 0.0;
    emission *= disableEmission; //popが始まると０をかける

    alpha *= fresnel;
    alpha += emission;
    alpha *= 1.0 - min(1.0, (popStarted * popSubAlpha) + popStarted * (popNoise * 0.3 + smoothstep(uPopTime * uPopSpeed * 0.1 * 0.8, 1.0, uPopTime * uPopSpeed)));

    vec4 finalColor = vec4(rainbow, alpha);

    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}