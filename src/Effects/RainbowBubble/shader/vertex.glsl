uniform float uPopTime;
uniform float uPopSpeed;
uniform sampler2D uNoiseTex;
uniform float uDistortionStrength; //0 or 1
uniform float uPopNoiseFrequency; //0.1 ~ 2


varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPopNoise;

#include ../../Utils/map.glsl
    
void main() {
    vec3 newPosition = position;

    float popTime = clamp(map(uPopTime * uPopSpeed, 0.0, 0.01, 0.0, 1.0), 0.0, 1.0);
    float noise = texture2D(uNoiseTex, vec2(position.x, position.y) * 0.03).r * 2.0 - 1.0;
    float popNoise = texture2D(uNoiseTex, vec2(position.x, position.y) * uPopNoiseFrequency).r;

    newPosition *= 1.0 + noise * uDistortionStrength; //distortion
    newPosition += newPosition * popNoise * popTime * 0.4; //pop noise

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    /*
    *   varying
    */
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
    vUv = uv;
    vPopNoise = popNoise;
}