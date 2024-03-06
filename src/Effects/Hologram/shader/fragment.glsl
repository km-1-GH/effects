uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vPosition;
varying vec3 vNormal;

float PI = 3.14159265359;

void main() {

    // Stripes
    float stripeInterval = 1.2;
    float vStripe = mod(vPosition.y * 20.0 - uTime, stripeInterval) * (1.0 / stripeInterval);
    float hStripe = mod(vPosition.x * 20.0 - uTime, stripeInterval) * (1.0 / stripeInterval);
    float stripes = pow(vStripe, 3.0);

    // Fresnel
    vec3 viewVector = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewVector, normalize(vNormal))), 2.0);
    // Falloff
    float fallOff = smoothstep(0.96, 0.0, fresnel);

    // Emission
    float emission = clamp(distance(mod(vPosition.y, 2.0), sin(mod(uTime * 0.4 + (mod(vPosition.x, 4.0) * 0.08), PI * 0.5)) * 5.0), 0.0, 1.0); 
    // modelposition.y -> 0~2, uTime+modelposition.x-> sin(0~0.5PI)*5 -> 0~5 -> near=０, far=１
    emission = smoothstep(0.8, 1.0, 1.0 - emission) * 0.4;

    // Color
    vec4 finalColor = vec4(uColor, (fresnel * fallOff + emission) * uOpacity);
    if (finalColor.a < 0.001) discard;
    gl_FragColor = finalColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}