uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uNoiseTex;

varying float vDelay;

void main()
{
    vec2 newPointCoord = gl_PointCoord * 2.0 - 1.0; // -1~1

    float noise = texture(uNoiseTex, newPointCoord * 0.4).r * 2.0 - 1.0; // -1~1
    newPointCoord += noise * 0.1;
    newPointCoord = newPointCoord * 0.5 + 0.5; // put back to 0~1

    float rimStrength = pow(distance(newPointCoord, vec2(0.5)) * 2.0, 2.0);
    vec3 smokeColor = mix(uColor1, uColor2, rimStrength);

    float strength = 1.0 - distance(newPointCoord, vec2(0.5)) * 2.0;
    strength = smoothstep(0.0, 0.5, strength);

    float fadeTime = uTime + vDelay;
    float alpha = 1.0 - fadeTime;

    vec4 color = vec4(smokeColor, strength * alpha);
    if (color.a < 0.01) discard;

    gl_FragColor = vec4(color);
    #include <colorspace_fragment>
}
