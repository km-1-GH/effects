uniform float uPopTime;
uniform sampler2D uNoiseTex;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vec3 newPosition = position;

    float popTime = 1.0 - pow(1.0 - uPopTime, 5.0);
    float noise = texture2D(uNoiseTex, uv).r;

    newPosition *= 1.0 + popTime * noise * 0.2;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
    vUv = uv;
}