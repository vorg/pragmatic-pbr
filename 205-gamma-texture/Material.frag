#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: lambert   = require(glsl-diffuse-lambert)
#pragma glslify: toLinear = require(glsl-gamma/in)
#pragma glslify: toGamma  = require(glsl-gamma/out)

varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPos;
varying vec2 vTexCoord0;

uniform sampler2D uAlbedoTex;

float PI = 3.14159265;

void main() {
    vec3 N = normalize(ecNormal);
    vec3 L = normalize(ecLightPos - ecPosition);

    float diffuse = lambert(L, N);

    //linear space lighting
    vec4 baseColor = toLinear(texture2D(uAlbedoTex, vTexCoord0 * vec2(3.0, 2.0)));
    vec4 finalColor = vec4(baseColor.rgb * diffuse, 1.0);
    gl_FragColor = toGamma(finalColor);
}
