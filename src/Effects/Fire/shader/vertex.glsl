attribute float aScale;
attribute float aDelay;
attribute float aMixColorRatio;

uniform float uTime;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D uNoiseTex;

varying float vDelay;
varying float vPositionX;
varying float vPositionY;
varying float vMixColorRatio;

float PI = 3.141592653589;

#include '../../Utils/map.glsl

void main() {
    /**
    * Position
    */
    vec3 newPosition = position;

    float spreadTime = clamp(map(uTime - aDelay * 0.3, 0.0, 0.5, 0.0, 1.0), 0.0, 1.0);
    newPosition += normalize(newPosition) * spreadTime;

    float noiseY = texture(uNoiseTex, vec2(0.5, position.x * 0.5 + 0.5) * 10.0).r; //0~1
    float riseTime = clamp(map(uTime - aDelay * 0.2, 0.2, 1.0, 0.0, 1.0), 0.0, 1.0); //-0.3~1.0 -> 0.0~1.0
    newPosition.y += noiseY * 8.0 * riseTime;

    float noiseX = texture(uNoiseTex, vec2(0.2, (position.x * 0.5 + 0.5) * 10.0)).r * 2.0 - 1.0; //0~1 -> -1~1
    newPosition.x += sin((riseTime + noiseX) * 12.0) * 0.2;
    newPosition.x *= 1.0 - (riseTime);

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * aScale * (1.0 - riseTime * 0.3) * min(1.0, spreadTime + 0.4);

    /**
    * varying
    */
    vDelay = aDelay;
    vPositionX = newPosition.x;
    vPositionY = newPosition.y;
    vMixColorRatio = aMixColorRatio;
}