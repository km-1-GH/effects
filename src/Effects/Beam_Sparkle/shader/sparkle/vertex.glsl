attribute float aAngle;
attribute float aSpeed;
attribute float aScale;
attribute float aRandom;
attribute float aDelay;

uniform vec3 uCenter;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uDuration;
uniform float uGravity;

varying float vAlpha;
varying float vRandom;
varying float vRotation;

float PI = 3.1415926535897932384626433832795;

void main() {
    float t = clamp((uTime - aDelay) / uDuration, 0.0, 1.0);

    // 勢いよく飛び出して減速 + 少しだけ落下
    float move = 1.0 - pow(1.0 - t, 3.0);
    vec3 dir = uRight * cos(aAngle) + uUp * sin(aAngle);
    vec3 worldPosition = uCenter + dir * aSpeed * move - uUp * t * t * uGravity;

    vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    /**
    * Size
    */
    float appear = smoothstep(0.0, 0.05, t);
    float shrink = 1.0 - smoothstep(0.5, 1.0, t);
    float twinkle = 0.75 + 0.25 * sin(uTime * 40.0 + aRandom * PI * 2.0);
    gl_PointSize = uSize * aScale * appear * shrink * twinkle * uResolution.y / - viewPosition.z;

    /**
    * Varyings
    */
    vAlpha = shrink;
    vRandom = aRandom;
    vRotation = aRandom * PI + uTime * (aRandom > 0.5 ? 4.0 : - 4.0);
}
