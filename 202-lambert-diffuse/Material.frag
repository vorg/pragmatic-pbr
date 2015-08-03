#ifdef GL_ES
precision highp float;
#endif

//require the lambert diffuse formula from a module via glslify
#pragma glslify: lambert   = require(glsl-diffuse-lambert)

varying vec3 ecNormal;
varying vec3 ecLightPos;
varying vec3 ecPosition;

void main() {
    //normalize the normal, we do it here instead of vertex
	 //shader for smoother gradients
    vec3 N = normalize(ecNormal);

    //calculate direction towards the light
    vec3 L = normalize(ecLightPos - ecPosition);

    //diffuse intensity
    float Id = lambert(L, N);

	//surface and light color, full white
    vec4 baseColor = vec4(1.0);
    vec4 lightColor = vec4(1.0);

    vec4 finalColor = vec4(baseColor.rgb * lightColor.rgb * Id, 1.0);
    gl_FragColor = finalColor;
}
