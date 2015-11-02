#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)
#pragma glslify: tonemapFilmic  = require(../local_modules/glsl-tonemap-filmic)
#pragma glslify: tonemapUncharted2  = require(../local_modules/glsl-tonemap-uncharted2)

varying vec3 wcNormal;

uniform sampler2D uEnvMap;
uniform float uExposure;
uniform float uTonemappingMethod;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(N)).rgb;
    gl_FragColor.rgb *= uExposure;

    if (uTonemappingMethod == 0.0) {
        //no tonemapping
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    else if (uTonemappingMethod == 1.0) {
        gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    else if (uTonemappingMethod == 2.0) {
        gl_FragColor.rgb = tonemapFilmic(gl_FragColor.rgb);
    }
    else if (uTonemappingMethod == 3.0) {
        gl_FragColor.rgb = tonemapUncharted2(gl_FragColor.rgb);
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }

    gl_FragColor.a = 1.0;
}
