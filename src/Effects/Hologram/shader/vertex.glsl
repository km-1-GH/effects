uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vLocalPosY;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
    vLocalPosY = position.y;
}