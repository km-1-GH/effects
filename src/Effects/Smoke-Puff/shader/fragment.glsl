uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uTexture;
varying float vDelay;

void main()
{
    vec2 newPointCoord = gl_PointCoord;

    newPointCoord.x += ((texture(uTexture, vec2(0.5, gl_PointCoord.x * 0.2)).r * 2.0) - 1.0) * 0.2;
    newPointCoord.y += ((texture(uTexture, vec2(0.5, gl_PointCoord.y * 0.2)).r * 2.0) - 1.0) * 0.2;

    float rimStrength = pow(distance(newPointCoord, vec2(0.5)) * 2.0, 2.0);
    vec3 smokeColor = mix(uColor1, uColor2, rimStrength);

    float strength = 1.0 - distance(newPointCoord, vec2(0.5)) * 2.0;
    strength = smoothstep(0.0, 0.5, strength);

    float alpha = 1.0 - uTime - vDelay;

    vec4 color = vec4(smokeColor, strength * alpha);
    if (color.a < 0.01) discard;

    gl_FragColor = vec4(color);
    #include <colorspace_fragment>
}
