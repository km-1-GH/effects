attribute float aDelay;
attribute float aTheta;
attribute vec2 aTexOffset;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uRadius;

varying vec2 vTexOffset;
varying float vRadiusTheta;

float PI = 3.1415926535897932384626433832795;
const float RADIUS_FACTOR = 0.2;
const float SIZE_FACTOR = 0.2;
const float SPEED_FACTOR = 0.8;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    float theta = PI * -uTime * SPEED_FACTOR + aTheta; //from 0 to 2PI
    float radiusTheta = sin(mod((-theta + aDelay) * 0.5, PI * 0.5)); //from 0 to 1
    float radius = uRadius * RADIUS_FACTOR * 0.7 + radiusTheta * RADIUS_FACTOR * 0.3;

    newPosition.x = cos(theta) * radius;
    newPosition.y = sin(theta) * radius;

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
    vRadiusTheta = radiusTheta;
}
