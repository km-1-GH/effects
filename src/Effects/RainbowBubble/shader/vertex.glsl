uniform float uPopTime;
uniform float uPopSpeed; // 0~3
uniform sampler2D uNoiseTex;
uniform float uDistortionStrength; //0 ~ 1
uniform float uDistortionFrequency; //0.01 ~ 1


varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

#include ../../Utils/map.glsl
    
void main() {
    vec3 newPosition = position;

    float popTime = clamp(map(uPopTime * uPopSpeed, 0.0, 0.1, 0.0, 1.0), 0.0, 1.0);
    float noise = texture2D(uNoiseTex, vec2(position.x, position.y) * uDistortionFrequency).r * 2.0 - 1.0; //0.03
    float popNoise = texture2D(uNoiseTex, vec2(uv.x, uv.y) * 3.0).r * 2.0 - 0.5; //-0.5~1.5
    float popNoise2 = texture2D(uNoiseTex, vec2(uv.x, uv.y) * 100.0).r * 2.0 - 0.5; //-0.5~1.5

    newPosition *= 1.0 + noise * uDistortionStrength; //distortion
    newPosition += newPosition * popNoise * sqrt(uPopTime * uPopSpeed);
    newPosition.y -= pow(uPopTime * uPopSpeed, 2.0) * abs(popNoise2) * 1.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    /*
    *   varying
    */
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
    vUv = uv;
}