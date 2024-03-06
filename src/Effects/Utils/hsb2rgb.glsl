vec3 hsb2rgb( in vec3 color ) {
    vec3 rgb = 
        clamp(
            abs(mod(color.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 
        0.0, 1.0 );
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return color.z * mix(vec3(1.0), rgb, color.y);
}