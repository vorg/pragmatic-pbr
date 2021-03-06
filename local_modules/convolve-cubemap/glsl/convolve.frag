//Based on Article - Physically Based Rendering by Marco Alamia
//http://www.codinglabs.net/article_physically_based_rendering.aspx

#ifdef GL_ES
precision highp float;
#endif

varying vec3 wcNormal;
varying vec2 scPosition;

uniform samplerCube uEnvMap;
uniform float uFace;
uniform bool uHighQuality;

const float PI = 3.1415926536;

void main() {
    vec3 normal = normalize( wcNormal );
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up,normal));
    up = cross(normal,right);

    vec3 sampledColour = vec3(0,0,0);
    float index = 0.0;

    if (uHighQuality) {
        const float dphi = 2.0 * PI / 180.0;
        const float dtheta = 0.5 * PI / 64.0;
        for(float phi = 0.0; phi < 6.283; phi += dphi) {
            for(float theta = 0.0; theta < 1.57; theta += dtheta) {
                vec3 temp = cos(phi) * right + sin(phi) * up;
                vec3 sampleVector = cos(theta) * normal + sin(theta) * temp;
                sampledColour += textureCube( uEnvMap, sampleVector ).rgb * cos(theta) * sin(theta);
                index++;
            }
        }
    }
    else {
        const float dphi = 2.0 * PI / 180.0 * 4.0;
        const float dtheta = 0.5 * PI / 64.0 * 4.0;
        for(float phi = 0.0; phi < 6.283; phi += dphi) {
            for(float theta = 0.0; theta < 1.57; theta += dtheta) {
                vec3 temp = cos(phi) * right + sin(phi) * up;
                vec3 sampleVector = cos(theta) * normal + sin(theta) * temp;
                sampledColour += textureCube( uEnvMap, sampleVector ).rgb * cos(theta) * sin(theta);
                index++;
            }
        }
    }

    gl_FragColor = vec4(PI * sampledColour / index, 1.0);
}
