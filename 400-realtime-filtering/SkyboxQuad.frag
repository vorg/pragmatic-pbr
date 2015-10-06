#ifdef GL_ES
precision highp float;
#endif

//#pragma glslify: texture2DLatEnvLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: envMapCube  = require(../local_modules/glsl-envmap-cube)
#pragma glslify: rgbe2rgb  = require(../local_modules/glsl-rgbe2rgb)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)
#pragma glslify: sky  = require(../local_modules/glsl-sky)

varying vec3 wcNormal;

//uniform sampler2D uReflectionMap;
uniform samplerCube uReflectionMap;
uniform float uExposure;
uniform vec3 uSunPosition;

void main() {
    vec3 N = normalize(wcNormal);
    //gl_FragColor.rgb = rgbe2rgb(texture2DLatEnvLong(uReflectionMap, N, flipEnvMap));
    //gl_FragColor.rgb = texture2DLatLong(uReflectionMap, N).rgb;
    gl_FragColor.rgb = textureCube(uReflectionMap, envMapCube(N)).rgb;
    gl_FragColor.rgb = sky(uSunPosition, wcNormal);
    //gl_FragColor.rgb = textureCube(uReflectionMap, N).rgb;
    gl_FragColor.rgb *= uExposure;
    gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
