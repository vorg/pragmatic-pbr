var Window       = require('pex-sys/Window');
var createSphere = require('primitive-sphere');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var Draw         = require('pex-draw');
var glslify      = require('glslify-promise');
var Texture2D    = require('pex-context/Texture2D');
var TextureCube  = require('pex-context/TextureCube');
var GUI          = require('pex-gui');
var parseHdr     = require('../local_modules/parse-hdr');
var parseDds     = require('parse-dds');
var isBrowser    = require('is-browser');
var UberMaterial = require('./UberMaterial');

function grid(x, y, w, h, nw, nh, margin){
    margin = margin || 0;
    var max =  nw * nh;
    var cw = Math.floor(w / nw);
    var ch = Math.floor(h / nh);
    var cells = [];
    for(var iy = 0; iy < nh; ++iy){
        for(var ix = 0; ix < nw; ++ix){
            cells.push([
                x + ix * cw + margin,
                y + iy * ch + margin,
                cw - 2 * margin,
                ch - 2 * margin
            ]);
        }
    }
    return cells;
}

var W = 1280;
var H = 720;

var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

var viewports = grid(200, 0, W-200, H, 3, 2);
var materials = [];

Window.create({
    settings: {
        width: 1280,
        height: 720
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/glsl/SkyboxQuad.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/glsl/SkyboxQuad.frag') },
        showNormalsVert: { text: __dirname + '/glsl/ShowNormals.vert' },
        showNormalsFrag: { text: __dirname + '/glsl/ShowNormals.frag' },
        showColorsVert: { text: __dirname + '/glsl/ShowColors.vert' },
        showColorsFrag: { text: __dirname + '/glsl/ShowColors.frag' },
        specularPhongVert: { glsl: glslify(__dirname + '/glsl/SpecularPhong.vert') },
        specularPhongFrag: { glsl: glslify(__dirname + '/glsl/SpecularPhong.frag') },
        specularGGXVert: { glsl: glslify(__dirname + '/glsl/SpecularGGX.vert') },
        specularGGXFrag: { glsl: glslify(__dirname + '/glsl/SpecularGGX.frag') },
        specularCookTorranceVert: { glsl: glslify(__dirname + '/glsl/SpecularCookTorrance.vert') },
        specularCookTorranceFrag: { glsl: glslify(__dirname + '/glsl/SpecularCookTorrance.frag') },
        uberShaderVert: { glsl: glslify(__dirname + '/glsl/UberShader.vert') },
        uberShaderFrag: { glsl: glslify(__dirname + '/glsl/UberShader.frag') },
        reflectionMap: { binary: ASSETS_DIR + '/envmaps/garage.hdr' },
        irradianceMap: { binary: ASSETS_DIR + '/envmaps/garage_diffuse.hdr' },
        irradianceCubemap: { binary: ASSETS_DIR + '/envmaps_pmrem_dds/GracieIrradiance.dds' },
        reflectionCubemap: { binary: ASSETS_DIR + '/envmaps_pmrem_dds/GracieReflection.dds' },
    },
    init: function() {
        this.initMeshes();
        this.initMaterials();
        this.initGUI();
        this.initCamera();
    },
    initCamera: function() {
        this.camera = new PerspCamera(45, viewports[0][2] / viewports[0][3], 0.1, 100);
        this.camera.lookAt([4, 0.5, -4], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, W, H);
        this.addEventListener(this.arcball);
    },
    initMeshes: function() {
        var ctx = this.getContext();

        var sphere = createSphere();
        var attributes = [
            { data: sphere.positions, location: ctx.ATTRIB_POSITION },
            { data: sphere.normals, location: ctx.ATTRIB_NORMAL },
            { data: sphere.uvs, location: ctx.ATTRIB_TEX_COORD_0 },
        ];
        var sphereIndices = { data: sphere.cells, usage: ctx.STATIC_DRAW };
        this.sphereMesh = ctx.createMesh(attributes, sphereIndices, ctx.TRIANGLES);

        var skyboxPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
        var skyboxFaces = [ [0, 1, 2], [0, 2, 3]];
        var skyboxAttributes = [
            { data: skyboxPositions, location: ctx.ATTRIB_POSITION },
        ];
        var skyboxIndices = { data: skyboxFaces };
        this.skyboxMesh = ctx.createMesh(skyboxAttributes, skyboxIndices);
    },
    initMaterials: function() {
        var ctx = this.getContext();
        var res = this.getResources();

        var irradianceMapInfo = parseHdr(res.irradianceMap);
        var irradianceMap = this.irradianceMap = ctx.createTexture2D(irradianceMapInfo.data, irradianceMapInfo.shape[0], irradianceMapInfo.shape[1], {
            type: ctx.FLOAT
        });

        var irradianceCubemapInfo = parseDds(res.irradianceCubemap);
        var numMipmapLevels = irradianceCubemapInfo.images.length / 6;
        var faces = [];
        for(var faceIndex=0; faceIndex<6; faceIndex++) {
          for(var mipmapLevel=0; mipmapLevel<numMipmapLevels; mipmapLevel++) {
              var faceInfo = irradianceCubemapInfo.images[faceIndex * numMipmapLevels + mipmapLevel];
              faces.push({
                  width: faceInfo.shape[0],
                  height: faceInfo.shape[1],
                  face: faceIndex,
                  lod: mipmapLevel,
                  data: new Float32Array(res.irradianceCubemap.slice(faceInfo.offset, faceInfo.offset + faceInfo.length))
              })
          }
        }
        var irradianceCubemap = this.irradianceCubemap = ctx.createTextureCube(faces, irradianceCubemapInfo.shape[0], irradianceCubemapInfo.shape[1], {
            type: ctx.FLOAT
        });

        var reflectionMapInfo = parseHdr(res.reflectionMap);
        var reflectionMap = this.reflectionMap = ctx.createTexture2D(reflectionMapInfo.data, reflectionMapInfo.shape[0], reflectionMapInfo.shape[1], {
            type: ctx.FLOAT
        });

        var reflectionCubemapInfo = parseDds(res.reflectionCubemap);
        var numMipmapLevels = reflectionCubemapInfo.images.length / 6;
        var faces = [];
        for(var faceIndex=0; faceIndex<6; faceIndex++) {
          for(var mipmapLevel=0; mipmapLevel<numMipmapLevels; mipmapLevel++) {
              var faceInfo = reflectionCubemapInfo.images[faceIndex * numMipmapLevels + mipmapLevel];
              faces.push({
                  width: faceInfo.shape[0],
                  height: faceInfo.shape[1],
                  face: faceIndex,
                  lod: mipmapLevel,
                  data: new Float32Array(res.reflectionCubemap.slice(faceInfo.offset, faceInfo.offset + faceInfo.length))
              })
          }
        }
        var reflectionCubemap = this.reflectionCubemap = ctx.createTextureCube(faces, reflectionCubemapInfo.shape[0], reflectionCubemapInfo.shape[1], {
            type: ctx.FLOAT,
            //minFilter: ctx.LINEAR_MIPMAP_LINEAR
            minFilter: ctx.LINEAR_MIPMAP_NEAREST
        });

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag)
        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag)

        this.debugDraw = new Draw(ctx);

        materials.push(new UberMaterial(ctx, {
            name: 'normals',
            uIrradianceMap: irradianceCubemap,
            uReflectionMap: reflectionCubemap,
            showNormals: true
        }))

        materials.push(new UberMaterial(ctx, {
            name: 'texCoords',
            uIrradianceMap: irradianceCubemap,
            uReflectionMap: reflectionCubemap,
            showTexCoords: true
        }))

        materials.push(new UberMaterial(ctx, {
            name: 'reflection',
            uIrradianceMap: irradianceCubemap,
            uReflectionMap: reflectionCubemap,
            useSpecular: true
        }))

        materials.push(new UberMaterial(ctx, {
            name: 'fresnel',
            uIrradianceMap: irradianceCubemap,
            uReflectionMap: reflectionCubemap,
            showFresnel: true
        }))

        materials.push(new UberMaterial(ctx, {
            name: 'final color',
            uIrradianceMap: irradianceCubemap,
            uReflectionMap: reflectionCubemap,
            uAlbedoColor: [0.6, 0.1, 0.1, 1.0],
            uAlbedoColorParams: { type: 'color' },
            uLightColor: [1, 1, 1, 1.0],
            uLightColorParams: { min: 0, max: 10 }
        }))
    },
    initGUI: function() {
        var ctx = this.getContext();

        var gui = this.gui = new GUI(ctx, W, H);
        this.addEventListener(gui)

        this.gui.addTexture2D('Reflection Map', this.reflectionMap)
        this.gui.addTexture2D('Irradiance Map', this.irradianceMap)
        this.gui.addTextureCube('Reflection CubeMap', this.reflectionCubemap)
        this.gui.addTextureCube('Irradiance CubeMap', this.irradianceCubemap)

        materials.forEach(function(material, i) {
            var viewport = viewports[i];
            gui.addHeader(material.name).setPosition(viewport[0] + 2, viewport[1] + 2)
            for(var unifornName in material.uniforms) {
                var params = material.uniforms[unifornName + 'Params'];
                if (params) {
                    gui.addParam(unifornName, material.uniforms, unifornName, params);
                }
            }
        })
    },
    onKeyPress: function(e) {
        if (e.str == 'g') {
            this.gui.toggleEnabled();
        }
    },
    draw: function() {
        var ctx = this.getContext();
        var dbg = this.debugDraw;

        this.arcball.apply();
        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.setDepthTest(true);

        for(var i in viewports) {
            var viewport = viewports[i];
            var material = materials[i];
            if (!material) {
                break;
            }

            ctx.pushState(ctx.VIEWPORT_BIT | ctx.SCISSOR_BIT);
            //flipping Y as viewport starts in bottom left
            ctx.setViewport(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setScissorTest(true)
            ctx.setScissor(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setClearColor(0.1, 0.1, 0.1, 0.0);
            ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

            if (material.uniforms && material.uniforms.uReflectionMap) {
                ctx.pushState(ctx.DEPTH_BIT);
                ctx.setDepthTest(false);
                ctx.bindProgram(this.skyboxProgram);
                this.skyboxProgram.setUniform('uExposure', material.uniforms.uExposure)
                this.skyboxProgram.setUniform('uEnvMap', 0)
                ctx.bindTexture(material.uniforms.uReflectionMap, 0)
                ctx.bindMesh(this.skyboxMesh);
                ctx.drawMesh()
                ctx.popState(ctx.DEPTH_BIT);
            }

            ctx.bindProgram(material.program);
            var numTextures = 0;
            for(var uniformName in material.uniforms) {
                var value = material.uniforms[uniformName];
                if ((value instanceof Texture2D) || (value instanceof TextureCube)) {
                    ctx.bindTexture(value, numTextures);
                    value = numTextures++;
                }
                if (material.program.hasUniform(uniformName)) {
                    material.program.setUniform(uniformName, value)
                }
            }

            ctx.bindMesh(this.sphereMesh);
            ctx.drawMesh();

            ctx.bindProgram(this.showColorsProgram);
            dbg.setColor([1,1,1,1])
            dbg.drawGrid(5);
            dbg.drawPivotAxes(2)

            ctx.popState(ctx.VIEWPORT_BIT | ctx.SCISSOR_BIT);
        }

        this.gui.draw();
    }
})
