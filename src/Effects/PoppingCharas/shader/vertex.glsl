attribute float aDelay;
attribute vec2 aTexOffset;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uHeight;

varying vec2 vTexOffset;
varying float vPopTime;

float PI = 3.1415926535897932384626433832795;
const float SIZE_FACTOR = 1.0;
const float HEIGHT_FACTOR = 1.0;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    float popTime = mod(uTime + aDelay, 1.0);
    newPosition.x -= cos(popTime * PI * 0.5) * position.x * 0.9;
    newPosition.x *= HEIGHT_FACTOR;
    newPosition.y += uSize * SIZE_FACTOR * 0.5 + sin(popTime * PI * 0.5) * uHeight * (1.5 - abs(position.x));
    newPosition.y *= HEIGHT_FACTOR;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * SIZE_FACTOR;

    /*
    * Delay
    */
    vTexOffset = aTexOffset;
    vPopTime = popTime;

}