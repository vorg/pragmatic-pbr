var Window       = require('pex-sys/Window');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var createCapsule = require('primitive-capsule');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var Draw         = require('pex-draw');
var glslify      = require('glslify-promise');
var Texture2D    = require('pex-context/Texture2D');
var TextureCube  = require('pex-context/TextureCube');
var GUI          = require('pex-gui');
var io           = require('pex-io');
var parseHdr     = require('../local_modules/parse-hdr');
var parseDds     = require('parse-dds');
var isBrowser    = require('is-browser');
var PBRMaterial         = require('./PBRMaterial.js');
var renderToCubemap     = require('../local_modules/render-to-cubemap');
var downsampleCubemap   = require('../local_modules/downsample-cubemap');
var convolveCubemap     = require('../local_modules/convolve-cubemap');
var prefilterCubemap    = require('../local_modules/prefilter-cubemap');
var envmapToCubemap     = require('../local_modules/envmap-to-cubemap');
var parseObj            = require('../local_modules/geom-parse-obj/');
var computeNormals      = require('../local_modules/geom-compute-normals/')
var centerAndResize     = require('../local_modules/geom-center-and-resize/');
var Vec3                = require('pex-math/Vec3');
var serializeObj        = require('../local_modules/geom-serialize-obj/');
var fs = require('fs');

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

var ROOT_DIR = isBrowser ? '.' :  __dirname + '';
var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

var viewports = grid(180, 0, W-180, H, 6, 4);
var materials = [];


var State = {
    roughness: 0.5,
    metalness: 0,
    ior: 1.4,
    exposure: 1.5,
    albedo: [1.0, 0.86, 0.57, 1.0],
    lightColor: [0, 0, 0, 1.0]
}

function loadTexture(ctx, url) {
    var tex = ctx.createTexture2D(null, 512, 512);
    io.loadImage(url, function(err, img) {
        tex.update(img, img.width, img.height, { flipY: true });
    })
    return tex;
}

Window.create({
    settings: {
        width: W,
        height: H
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/SkyboxQuad.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/SkyboxQuad.frag') },
        showColorsVert: { text: ROOT_DIR + '/ShowColors.vert' },
        showColorsFrag: { text: ROOT_DIR + '/ShowColors.frag' },

        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/grace-new.hdr' },
        reflectionMap: { binary: ASSETS_DIR + '/envmaps/garage.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/14-Hamarikyu_Bridge_B.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/Ridgecrest_Road_Ref.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/Mono_Lake_B_Ref.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/NarrowPath_3k.hdr' },

        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/20050806-03_hd.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/20060807_wells6_hd.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/20070111-17_hd.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/hallstatt4_hd.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/uprat5_hd.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/20100905-21_hdr.hdr' },


        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/Factory_Catwalk.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/Ditch-River_2k.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/Bryant_Park_2k.hdr' },

        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/glacier.hdr' },
        //reflectionMap: { binary: ASSETS_DIR + '/envmaps/temp/uffizi.hdr' },

        //blob: { text: ASSETS_DIR + '/models/blob.obj' },
        //head: { text: ASSETS_DIR + '/models/head2.obj' },
    },
    init: function() {
        this.initMeshes();
        this.initMaterials();
        this.initGUI();
        this.initCamera();
    },
    initCamera: function() {
        this.camera = new PerspCamera(45, viewports[0][2] / viewports[0][3], 0.1, 100);
        this.camera.lookAt([2, 0.5, -4], [0, -0.5, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);
    },
    initMeshes: function() {
        var ctx = this.getContext();
        var res = this.getResources();

        var capsule = createCapsule(0.6, 1, 24, 24);
        // capsule = createSphere();
        //   capsule = parseObj(res.head)
        //   capsule.positions = centerAndResize(capsule.positions, 3);
        //   capsule.normals = computeNormals(capsule.positions, capsule.cells)
        //   capsule.uvs = capsule.positions.map(function(p) {
        //        var u = Math.atan2(p[1],p[0]) / (Math.PI*2);
        //        if (u < 0)
        //            u = 1 + u;
        //        var v = 0.5 + Math.atan2(p[2], Math.sqrt(p[0]*p[0]+p[1]*p[1])) / Math.PI;
        //        return [u, v]
        //   })
        var attributes = [
            { data: capsule.positions, location: ctx.ATTRIB_POSITION },
            { data: capsule.normals, location: ctx.ATTRIB_NORMAL },
            { data: capsule.uvs, location: ctx.ATTRIB_TEX_COORD_0 },
        ];
        var capsuleIndices = { data: capsule.cells, usage: ctx.STATIC_DRAW };
        this.capsuleMesh = ctx.createMesh(attributes, capsuleIndices, ctx.TRIANGLES);

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

        if (isBrowser) {
            ctx.getGL().getExtension('OES_standard_derivatives')
            ctx.getGL().getExtension('EXT_shader_texture_lod')
        }

        var reflectionMapInfo = parseHdr(res.reflectionMap);
        var reflectionMap = this.reflectionMap = ctx.createTexture2D(reflectionMapInfo.data, reflectionMapInfo.shape[0], reflectionMapInfo.shape[1], {
            type: ctx.FLOAT
        });

        var CUBEMAP_SIZE = 256;

        //TODO: seamless cubemap sampling would help...
        this.reflectionCubemap = ctx.createTextureCube(null, CUBEMAP_SIZE, CUBEMAP_SIZE, { type: ctx.FLOAT, minFilter: ctx.LINEAR_MIPMAP_LINEAR, magFilter: ctx.LINEAR });
        this.reflectionPREM = ctx.createTextureCube(null, CUBEMAP_SIZE, CUBEMAP_SIZE, { type: ctx.FLOAT, minFilter: ctx.LINEAR_MIPMAP_LINEAR, magFilter: ctx.LINEAR });
        this.reflectionMap128 = ctx.createTextureCube(null, CUBEMAP_SIZE/2, CUBEMAP_SIZE/2, { type: ctx.FLOAT, minFilter: ctx.NEAREST, magFilter: ctx.NEAREST });
        this.reflectionMap64 = ctx.createTextureCube(null, CUBEMAP_SIZE/4, CUBEMAP_SIZE/4, { type: ctx.FLOAT, minFilter: ctx.NEAREST, magFilter: ctx.NEAREST });
        this.reflectionMap32 = ctx.createTextureCube(null, CUBEMAP_SIZE/8, CUBEMAP_SIZE/8, { type: ctx.FLOAT, minFilter: ctx.NEAREST, magFilter: ctx.NEAREST });
        this.irradianceCubemapConv = ctx.createTextureCube(null, CUBEMAP_SIZE/8, CUBEMAP_SIZE/8, { type: ctx.FLOAT });

        envmapToCubemap(ctx, this.reflectionMap, this.reflectionCubemap); //render envmap to cubemap

        ctx.bindTexture(this.reflectionCubemap);
        var gl = ctx.getGL();
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameterf(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );

        ctx.bindTexture(this.reflectionPREM);
        var gl = ctx.getGL();
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameterf(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
        gl.texParameterf(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );


        downsampleCubemap(ctx, this.reflectionCubemap, this.reflectionMap128);
        downsampleCubemap(ctx, this.reflectionMap128, this.reflectionMap64);
        downsampleCubemap(ctx, this.reflectionMap64,  this.reflectionMap32);
        convolveCubemap(ctx,   this.reflectionMap32,  this.irradianceCubemapConv);
        prefilterCubemap(ctx,   this.reflectionCubemap,  this.reflectionPREM);

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag)
        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag)

        this.debugDraw = new Draw(ctx);

        //dielectric
        for(var i=0; i<6; i++) {
            materials.push(new PBRMaterial(ctx, {
                uExposure: State.exposure,
                uRoughness: i/5,
                uIrradianceMap: this.irradianceCubemapConv,
                uReflectionMap: this.reflectionPREM,
                uAlbedoColor: [0.8, 0.2, 0.2, 1.0],
                uLightColor: [1, 1, 1, 1.0]
            }))
        }

        //metallic
        for(var i=0; i<6; i++) {
            materials.push(new PBRMaterial(ctx, {
                uExposure: State.exposure,
                uRoughness: i/5,
                uMetalness: 1,
                uIrradianceMap: this.irradianceCubemapConv,
                uReflectionMap: this.reflectionPREM,
                uAlbedoColor: [1.0, 0.86, 0.57, 1.0],
                uLightColor: [1, 1, 1, 1.0]
            }))
        }

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ScifiTrimPieces_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ScifiTrimPieces_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ScifiTrimPieces_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ScifiTrimPieces_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_SciFiDetailKit_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_SciFiDetailKit_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_SciFiDetailKit_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_SciFiDetailKit_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Misc_PaintedBarrel_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Misc_PaintedBarrel_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Misc_PaintedBarrel_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Misc_PaintedBarrel_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))


        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Wood_AlternatingSquareTiles_Base_Color_2.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Wood_AlternatingSquareTiles_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Wood_AlternatingSquareTiles_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Wood_AlternatingSquareTiles_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_Gold_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_Gold_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_Gold_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_Gold_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ChromeScratched_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ChromeScratched_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ChromeScratched_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_ChromeScratched_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_AluminiumDirectional_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_AluminiumDirectional_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_AluminiumDirectional_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Metal_AluminiumDirectional_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_Disgusting_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_Disgusting_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_Disgusting_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_Disgusting_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_CurveSandTiles_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_CurveSandTiles_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_CurveSandTiles_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Tile_CurveSandTiles_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Concrete_EpoxyPaintedFloor_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Concrete_EpoxyPaintedFloor_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Concrete_EpoxyPaintedFloor_Metallic.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Concrete_EpoxyPaintedFloor_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Metalness.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Base_Color_2.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Roughness_2.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Metalness_2.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Normal_2.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Base_Color.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Roughness.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Metalness.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Normal.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))

        materials.push(new PBRMaterial(ctx, {
            uAlbedoColor: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Base_Color_2.png'),
            uRoughness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Roughness_2.png'),
            uMetalness: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Metalness_2.png'),
            uNormalMap: loadTexture(ctx, ASSETS_DIR + '/textures/Plastic_Normal_2.png'),
            uExposure: State.exposure,
            uIrradianceMap: this.irradianceCubemapConv,
            uReflectionMap: this.reflectionPREM,
        }))
    },
    initGUI: function() {
        var ctx = this.getContext();

        var gui = this.gui = new GUI(ctx, W, H);
        this.addEventListener(gui)

        this.gui.addTexture2D('Reflection Map', this.reflectionMap)
        this.gui.addTextureCube('Reflection PREM', this.reflectionPREM)
        this.gui.addTextureCube('Irradiance Conv', this.irradianceCubemapConv)

        this.gui.addParam('lightColor', State, 'lightColor', { min: 0, max:10 }, function(value) {
            materials.forEach(function(material, i) {
                material.uniforms.uLightColor = value;
            })
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
            var H = this.getHeight();
            ctx.setViewport(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setScissorTest(true)
            ctx.setScissor(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setClearColor(0.4, 0.1, 0.1, 0.0);
            ctx.setClearColor(material.uniforms.uAlbedoColor[0], material.uniforms.uAlbedoColor[1], material.uniforms.uAlbedoColor[2], 0.0);
            ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

            if (material.uniforms && material.uniforms.uReflectionMap) {
                ctx.pushState(ctx.DEPTH_BIT);
                ctx.setDepthTest(false);
                ctx.bindProgram(this.skyboxProgram);
                this.skyboxProgram.setUniform('uExposure', material.uniforms.uExposure)
                this.skyboxProgram.setUniform('uEnvMap', 0)
                ctx.bindTexture(material.uniforms.uReflectionMap, 0)
                ctx.bindTexture(material.uniforms.uIrradianceMap, 0) //for blurred background
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


            ctx.pushModelMatrix();
            ctx.bindMesh(this.capsuleMesh);
            ctx.drawMesh();
            ctx.popModelMatrix();

            if (this.debug) {
                ctx.bindProgram(this.showColorsProgram);
                dbg.setColor([1,1,1,1])
                dbg.drawGrid(5);
                dbg.drawPivotAxes(2)
                dbg.setColor([1,1,1,1])
                var L = Vec3.normalize([10,10,0]);
                var V = Vec3.normalize(Vec3.copy(this.camera.getPosition()))
                var H = Vec3.normalize(Vec3.add(Vec3.copy(V), L));
                dbg.drawVector(Vec3.scale(L, 2));
                dbg.setColor([1,1,0,1])
                dbg.drawVector(Vec3.scale(H, 2));
            }


            ctx.popState(ctx.VIEWPORT_BIT | ctx.SCISSOR_BIT);
        }

        this.gui.draw();
    }
})
