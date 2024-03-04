attribute float aScale;
attribute float aDelay;

uniform float uTime;
uniform float uSize;
uniform vec2 uResolution;

varying float vDelay;

float PI = 3.141592653589;

void main() {
    /**
    * Position
    */
    vec3 newPosition = position;

    newPosition.y += mod(uTime + aDelay, 0.5) * 5.0;
    newPosition.x += sin(uTime * (12.0 * aDelay)) * min(0.3, distance(2.0, newPosition.y)); //aDelay -> noise

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
    vDelay = aDelay;

}