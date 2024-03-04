uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

#include ../../Utils/rotate2D.glsl

void main() {
    vec3 newPosition = position;

    // Twins
    float twist = texture(uPerlinTexture, vec2(0.5, uv.y * 0.2 - uTime * 0.005)).r;
    newPosition.xz = rotate2D(newPosition.xz, twist * 12.0);

    // Wind
    vec2 windOffset = vec2(
        texture(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5, 
        texture(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5
    );
    windOffset *= pow(uv.y, 3.0) * 10.0;
    newPosition.xz += windOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    vUv = uv;
}