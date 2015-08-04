#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: lambert   = require(glsl-diffuse-lambert)
#pragma glslify: toLinear = require(glsl-gamma/in)
#pragma glslify: toGamma  = require(glsl-gamma/out)

//vertex position, normal and light position in the eye/view space
varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPos;

float PI = 3.14159265;

void main() {
    vec3 N = normalize(ecNormal);
    vec3 L = normalize(ecLightPos - ecPosition);

    //diffuse intensity
    float Id = lambert(L, N);

    //surface and light color, full white
    vec4 baseColor = vec4(1.0);
    vec4 lightColor = vec4(1.0);

    vec4 finalColor = vec4(baseColor.rgb * lightColor.rgb * Id, 1.0);
    gl_FragColor = toGamma(finalColor);
}
