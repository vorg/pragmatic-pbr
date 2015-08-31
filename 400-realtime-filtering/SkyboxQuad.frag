#ifdef GL_ES
precision highp float;
#endif

//#pragma glslify: texture2DLatEnvLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: textureCubeEnv  = require(../local_modules/glsl-textureCube-env)
#pragma glslify: rgbe2rgb  = require(../local_modules/glsl-rgbe2rgb)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)

varying vec3 vNormal;

//uniform sampler2D uReflectionMap;
uniform samplerCube uReflectionMap;
uniform float uExposure;

float flipEnvMap = -1.0;

void main() {
    vec3 N = normalize(vNormal);
    //gl_FragColor.rgb = rgbe2rgb(texture2DLatEnvLong(uReflectionMap, N, flipEnvMap));
    //gl_FragColor.rgb = texture2DLatLong(uReflectionMap, N).rgb;
    gl_FragColor.rgb = textureCubeEnv(uReflectionMap, N, flipEnvMap).rgb;
    //gl_FragColor.rgb = textureCube(uReflectionMap, N).rgb;
    gl_FragColor.rgb *= uExposure;
    gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
