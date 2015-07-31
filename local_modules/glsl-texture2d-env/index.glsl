vec4 texture2DEnv(sampler2D tex, vec3 N) {
    vec2 texCoord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(N.y)/3.14159265359);
    return texture2D(tex, texCoord);
}

#pragma glslify: export(texture2DEnv)
