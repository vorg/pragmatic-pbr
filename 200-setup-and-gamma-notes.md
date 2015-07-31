# Gamma correction and linear space

#### [The Importance of Being Linear](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch24.html) from GPU Gems 3

> The automatic sRGB corrections are free and are preferred to performing the corrections manually in a shader after each texture access, as shown in Listing 24-1, because each pow instruction is scalar and expanded to two instructions. Also, manual correction happens after filtering, which is incorrectly performed in a nonlinear space.

#### [Linear-Space Lighting (i.e. Gamma)](http://filmicgames.com/archives/299) 2010

#### [EXT_sRGB](https://www.khronos.org/registry/webgl/extensions/EXT_sRGB)

> The sRGB color space is based on typical (non-linear)

According to [WebGL Report](http://webglreport.com/?v=1) supported in:

- [x] Chrome 43+ on OSX
- [x] Firefox 39+ on OSX
- [x] Webkit Nighly r186719 on OSX
- [ ] Safari 8.0.7 on OSX

EXT_sRGB will be in core WebGL 2.0

#### [Udacity Interactive 3D Graphics: Gamma Correction ](https://www.udacity.com/course/viewer#!/c-cs291/l-124106597/m-176585829) 2013?

```
renderer.gammaInput = true
renderer.gammaOutput = true
```


#### [ThreeJS: Improving correctness of gamma application](https://github.com/mrdoob/three.js/issues/5838) 2014
#### [ThreeJS: Texture encoding example code, and thoughts on a correct implementation](https://github.com/mrdoob/three.js/issues/6593) 2015

```
THREE.Linear = 3000;
THREE.sRGB = 3001;
THREE.RGBE = 3002;
THREE.LogLuv = 3003;
```

# sRGB

SRGB in WebGL (core in WebGL 2.0) is enabled through
[EXT_sRGB](https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt)

Which is based on
[ARB_framebuffer_sRGB](https://www.opengl.org/registry/specs/ARB/framebuffer_sRGB.txt)
[EXT_texture_sRGB](https://www.opengl.org/registry/specs/EXT/texture_sRGB.txt)


http://www.pauldebevec.com/Probes/
http://gl.ict.usc.edu/Data/HighResProbes/

[Gamma correct and HDR rendering in a 32 bits buffer](http://lousodrome.net/blog/light/tag/rgbm/)
