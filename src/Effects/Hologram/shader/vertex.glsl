uniform float uTime;
uniform float uSpeed;

varying vec3 vPosition;
varying vec3 vNormal;

#include ../../Utils/random2D.glsl

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch
    float glitchTime = uTime * uSpeed - modelPosition.y;
    float glitchStrengh = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76) / 3.0;
    glitchStrengh = smoothstep(0.8, 1.0, glitchStrengh) * 0.15;
    modelPosition.x += (random2D(modelPosition.xz + uTime * 0.1) - 0.5) * glitchStrengh;
    modelPosition.z += (random2D(modelPosition.zx + uTime * 0.1) - 0.5) * glitchStrengh;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
}