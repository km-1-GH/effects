attribute float aScale;
attribute float aDelay;
attribute float aMixColorRatio;

uniform float uTime;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D uNoiseTex;

varying float vNoiseValue1;
varying float vPositionX;
varying float vPositionY;
varying float vMixColorRatio;

float PI = 3.141592653589;

void main() {
    /**
    * Position
    */
    vec3 newPosition = position;

    float riseTime = mod(uTime + aDelay, 0.5) * 2.0; //0~0.5 -> 0~1
    newPosition.y += riseTime * 4.0;
    float noise = texture(uNoiseTex, vec2(0.5, (position.x + 1.0) / 2.0)).r * 2.0 - 1.0; //0~1 -> -1~1
    newPosition.x += sin(uTime * 2.0 + noise * 10.0) * sin(riseTime * PI + (PI * 0.2)) * 0.5; //aDelay -> noise

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * aScale;

    /**
    * varying
    */
    vNoiseValue1 = noise;
    vPositionX = newPosition.x;
    vPositionY = newPosition.y;
    vMixColorRatio = aMixColorRatio;

}