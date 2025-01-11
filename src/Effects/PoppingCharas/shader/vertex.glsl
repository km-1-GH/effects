attribute float aDelay;
attribute vec2 aTexOffset;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uHeight;

varying vec2 vTexOffset;
varying float vPopTime;

float PI = 3.1415926535897932384626433832795;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    float popTime = mod(uTime + aDelay, 1.0);
    newPosition.x -= cos(popTime * PI * 0.6) * position.x;
    newPosition.y += sin(popTime * PI * 0.6) * uHeight * (1.5 - abs(position.x));

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize;

    /*
    * Delay
    */
    vTexOffset = aTexOffset;
    vPopTime = popTime;

}