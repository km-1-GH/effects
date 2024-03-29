uniform float uPopTime;
uniform sampler2D uNoiseTex;
uniform float uDistortionStrength;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
    
void main() {
    vec3 newPosition = position;

    float popTime = 1.0 - pow(1.0 - uPopTime, 5.0);
    float noise = texture2D(uNoiseTex, vec2(position.x, position.y) * 0.03).r * 2.0 - 1.0;

    newPosition *= (1.0 + noise * uDistortionStrength) * (1.0 + popTime * 0.4);

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