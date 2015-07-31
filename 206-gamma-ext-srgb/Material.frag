#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: lambert   = require(glsl-diffuse-lambert)
#pragma glslify: toGamma  = require(glsl-gamma/out)

varying vec3 ecNormal;
varying vec3 ecLight;
varying vec3 ecPosition;
varying vec2 vTexCoord0;

uniform sampler2D uAlbedoTex;

float PI = 3.14159265;

void main() {
    vec3 N = normalize(ecNormal);
    vec3 L = normalize(ecLight - ecPosition);
    vec3 V = normalize(-ecPosition);
    float diffuse = lambert(L, N);

    //sample color as usual, the RGB values will be converted to linear space for you
    vec4 baseColor = texture2D(uAlbedoTex, vTexCoord0 * vec2(3.0, 2.0));
    vec4 finalColor = vec4(baseColor.rgb * diffuse, 1.0);

    //we still need to bring it back to the gamma color space as we don't have sRGB aware render buffer here
    gl_FragColor = toGamma(finalColor);
}
