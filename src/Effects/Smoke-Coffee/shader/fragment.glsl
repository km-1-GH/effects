uniform sampler2D uPerlinTexture;
uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    // Scale and Animate
    vec2 smokeUv = vUv;
    smokeUv.x *= 0.3;
    smokeUv.y *= 0.3;
    smokeUv.y -= uTime * 0.04;
    
    // Smoke
    float smoke = texture(uPerlinTexture, smokeUv).r;

    // remap
    smoke = smoothstep(0.5, 1.0, smoke);
    
    // Edges
    smoke *= smoothstep(0.0, 0.1, vUv.x);
    smoke *= smoothstep(1.0, 0.9, vUv.x);
    smoke *= smoothstep(0.0, 0.1, vUv.y);
    smoke *= smoothstep(1.0, 0.5, vUv.y);
    
    gl_FragColor = vec4(uColor, smoke);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}