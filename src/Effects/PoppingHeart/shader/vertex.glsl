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

    float riseTime = clamp(map(mod(uTime, 3.0) - aDelay, 0.0, 3.0, 0.0, 1.0), 0.0, 1.0);
    vec3 vector = normalize(position);
    newPosition.x += vector.x * pow(riseTime, 2.0) * 5.0;
    newPosition.y += (1.0 - (pow(1.0 - riseTime, 2.0))) * 3.0 * uHeight;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    float scaleTime = clamp(map(mod(uTime, 3.0) - aDelay, 0.0, 0.6, 0.0, 1.0), 0.0, 1.0) * 2.0;
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * aScale * scaleTime;

    /*
    * Delay
    */
    vDelay = aDelay;
}