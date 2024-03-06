uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vPosition;
varying vec3 vNormal;

float PI = 3.14159265359;

void main() {
    vec3 normalizedNormal = normalize(vNormal);
    if (!gl_FrontFacing)
        normalizedNormal = -normalizedNormal;

    // Stripes
    float stripeInterval = 1.0;
    float vStripe = mod(vPosition.y * 20.0 - uTime, stripeInterval) * (1.0 / stripeInterval);
    float hStripe = mod(vPosition.x * 20.0 - uTime, stripeInterval) * (1.0 / stripeInterval);
    float stripes = pow(vStripe, 3.0);

    // Fresnel
    vec3 viewVector = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewVector, normalizedNormal)), 2.0);

    // Falloff
    float fallOff = smoothstep(0.99, 0.0, fresnel);

    float hologram = fresnel * stripes + fresnel * 1.25;
    hologram *= fallOff;

    // Color
    vec4 finalColor = vec4(uColor, hologram * uOpacity);
    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}