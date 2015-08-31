#define PI 3.1415926
#define TwoPI (2.0 * PI)
#define OneOverPI (1.0/PI)
#define OneOverTwoPI (1.0/TwoPI)

//Based on http://http.developer.nvidia.com/GPUGems/gpugems_ch17.html
vec4 texture2DLatLong(sampler2D tex, vec3 N) {
    float theta = acos(N.y);
    //float phi = atan(N.x, -N.z) + PI;
    //atan2(N.x, -N.z) according to the pisa website http://gl.ict.usc.edu/Data/HighResProbes/
    float phi = atan(N.x, N.z) + PI;
    vec2 texCoord = vec2(phi, theta) * vec2(OneOverTwoPI, OneOverPI);
    return texture2D(tex, texCoord);
    //float theta = acos(N.y);
    //float phi = atan(N.z, N.x) + PI;
    //vec2 texCoord = vec2(phi * OneOverTwoPI, theta * OneOverPI);
    //return texture2D(tex, texCoord);
    //float theta = -N.y * 0.5 + 0.5;
    //float phi = atan(N.z, N.x) * OneOverTwoPI + 0.5;
    //vec2 texCoord = vec2(phi, theta);
    //return texture2D(tex, texCoord);
}

#pragma glslify: export(texture2DLatLong)
