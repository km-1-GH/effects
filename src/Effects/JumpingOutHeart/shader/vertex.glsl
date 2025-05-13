attribute float aScale;
attribute float aDelay;
attribute float aTexRotateTheta;

uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;  // 0~1
uniform float uHeight;

varying float vDelay;
varying float vTexRotateTheta;

float PI = 3.1415926535897932384626433832795;

#include '../../Utils/map.glsl'

void main() {
    vec3 newPosition = position;

    float popTime = min(1.4, max(0.0, uTime - aDelay)); // 0~1.4
    popTime = sqrt(popTime);

    vec3 vector = normalize(position);
    newPosition += vector * popTime * 0.14;
    newPosition.y *= sin((popTime / 0.7) * PI) * uHeight * 10.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    float fadeInScale = clamp(map(popTime, 0.0, 0.1, 0.0, 1.0), 0.0, 1.0);
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * aScale * fadeInScale;

    /*
    * Delay
    */
    vDelay = aDelay;
    vTexRotateTheta = aTexRotateTheta;
}
