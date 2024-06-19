uniform float uTime;
uniform float uPopSpeed;
uniform float uPopTime;
uniform sampler2D uNoiseTex;
uniform float uHueOffset;
uniform float uHueRange;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPopNoise;

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
        0.8,
        1.0
    ));

    // Pop
    float popNoise = smoothstep(0.99, 0.98, vPopNoise);
    float popTime = uPopTime * uPopSpeed * 0.01;
    float popAfterImgTime = smoothstep(0.5, 0.9, popTime); //0~1

    float popStartTime = (1.0 - step(0.1, uPopTime)); //popが始まって0.01秒後に０になる
    emission *= popStartTime; //popが始まると０をかける
    fresnel -= (1.0 - vPopNoise) * (1.0 - popStartTime) * 0.5; //popが始まるとvPopNoiseで０のところのfresnelを減らす
    alpha *= fresnel;
    alpha += emission;
    vec4 finalColor = vec4(rainbow, alpha - popAfterImgTime - (popNoise * uPopTime));
    // vec4 finalColor = vec4(vec3(1.0 - popAfterImgTime), 1.0);

    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}