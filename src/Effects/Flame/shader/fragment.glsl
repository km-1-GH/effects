uniform float uTime;

#include ../../Utils/map.glsl

void main() {
    
    gl_FragColor = vec4(0.14, 0.05, 0.9, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}