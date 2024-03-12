attribute float aScale;
attribute float aDelay;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uHeight;

varying float vDelay;

float PI = 3.1415926535897932384626433832795;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    vec3 direction = normalize(position);
    float distance = 1.0 + length(position) * 10.0;
    float spreadTime = clamp(map(mod(uTime, 5.0), 0.0, 0.3, 0.0, 1.0), 0.0, 1.0);
    spreadTime = 1.0 - pow(1.0 - spreadTime, 2.0);
    float fallingTime = clamp(map(mod(uTime, 5.0), 0.2, 5.0, 0.0, 1.0), 0.0, 1.0);

    newPosition += direction * distance * spreadTime * 3.0;
    newPosition.y += spreadTime;
    newPosition.y -= pow((fallingTime + abs(aDelay)), 2.0);
    newPosition.x += fallingTime * aDelay * 2.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    float scale = uSize * aScale * (abs(sin((fallingTime + (direction.x * direction.y * direction.z)) * 10.0)) * 0.5 + 0.5);
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * scale;

    /**
    * Varyings
    */
    vDelay = aDelay;

}