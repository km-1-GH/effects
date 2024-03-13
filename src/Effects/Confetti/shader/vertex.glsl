attribute float aScale;
attribute float aRandom;
attribute float aRadius;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform vec3 uDirection;
uniform float uDuration;

varying float vRandom;
varying float vRandomByPos;

float PI = 3.1415926535897932384626433832795;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    // spread
    float popAndSpreadTime = clamp(map(mod(uTime, uDuration), 0.0, 0.3, 0.0, 1.0), 0.0, 1.0);
    float spreadTime = pow(popAndSpreadTime, 4.0);
    float popTime = 1.0 - pow(1.0 - spreadTime, 2.0);

    vec3 normalizedPos = normalize(position);
    newPosition += aRadius * normalizedPos * spreadTime * 3.0 + popTime * normalize(uDirection) * 5.0;

    // falling
    float randomByPos = normalizedPos.x * normalizedPos.y * normalizedPos.z;
    float fallingTime = clamp(map(mod(uTime, uDuration), 0.2, uDuration, 0.0, 1.0), 0.0, 1.0);
    newPosition.y -= sin((fallingTime + randomByPos * 4.0) * 10.0) * 0.2 + fallingTime * 4.0 * (uDuration / 10.0); //animationDuration:10.0 -> 4.0
    newPosition.x += fallingTime * aRandom * 3.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    float scale = uSize * aScale * (abs(sin((fallingTime + randomByPos) * 10.0)) * 0.5 + 0.5);
    // float scale = uSize * aScale * (abs(sin((fallingTime + aRandom) * 10.0)) * 0.5 + 0.5);
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * scale;

    /**
    * Varyings
    */
    vRandom = aRandom;
    vRandomByPos = randomByPos;
}