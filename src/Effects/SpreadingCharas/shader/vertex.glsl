attribute float aDelay;
attribute float aTheta;
attribute vec2 aTexOffset;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uRadius;
uniform float uSpreadRate;

varying vec2 vTexOffset;
varying float vSpreadTime;

float PI = 3.1415926535897932384626433832795;
const float RADIUS_FACTOR = 0.2;
const float SIZE_FACTOR = 0.2;
const float SPEED_FACTOR = 0.75;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    float theta = PI * -uTime * SPEED_FACTOR * 0.2 + aTheta; //from 0 to 2PI
    float radiusTheta = sin(mod((-theta + aDelay) * 0.5, PI * 0.5)); //from 0 to 1
    float radius = uRadius * RADIUS_FACTOR * 0.7 + radiusTheta * RADIUS_FACTOR * 0.3;

    float spreadTime = 1.0 - pow(1.0 - (mod(uTime + aDelay, 1.0 * SPEED_FACTOR)) / SPEED_FACTOR, 2.0);
    spreadTime = spreadTime * (1.0 - uSpreadRate) + uSpreadRate; // uSpreadRate to 1.0

    newPosition.x = cos(theta) * radius * spreadTime;
    newPosition.y = sin(theta) * radius * spreadTime;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * SIZE_FACTOR;

    /**
    * Varying
    */
    vTexOffset = aTexOffset;
    vSpreadTime = spreadTime;
}
