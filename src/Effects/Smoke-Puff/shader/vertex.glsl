attribute float aScale;
attribute float aDelay;

uniform float uSize;
uniform float uMeshScale;
uniform float uTime;
uniform vec2 uResolution;

varying float vDelay;

void main()
{
    /**
    * Position
    */
    float expandVelocity = sqrt(uTime);
    vec3 newPosition = position;
    newPosition += normalize(position) * expandVelocity * 1.0;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
    * Size
    */
    gl_PointSize = (1.0 / - viewPosition.z) * uResolution.y * uSize * uMeshScale * aScale;

    /**
    * varying
    */
    vDelay = aDelay;
}
