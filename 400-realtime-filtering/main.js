var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var MathUtils    = require('pex-math/Utils');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var parseHdr     = require('../local_modules/parse-hdr');
var remap        = require('re-map');
var isBrowser    = require('is-browser');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var fs           = require('fs');
var hammersley   = require('./hammersley');
var GUI          = require('pex-gui');
var parseDDS     = require('parse-dds');
var Draw         = require('pex-draw');

var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

function log2(x) {
  return Math.log(x) / Math.LN2;
}

function loadDDSCubemap(buf) {
    var header = new Uint32Array(buf);

    var width = header[4];
    var height = header[3];
    var mips = Math.max(header[7], 1);
    var isFourCc = header[20] === 4;
    var fcc = header[21];
    var bpp = header[22];

    var fccDxt1 = 827611204; // DXT1
    var fccDxt5 = 894720068; // DXT5
    var fccFp32 = 116; // RGBA32f

    var format = null;
    var compressed = false;
    var floating = false;
    if (isFourCc) {
        if (fcc===fccDxt1) {
            format = 'PIXELFORMAT_DXT1';
            compressed = true;
        } else if (fcc===fccDxt5) {
            format = 'PIXELFORMAT_DXT5';
            compressed = true;
        } else if (fcc===fccFp32) {
            format = 'PIXELFORMAT_RGBA32F';
            floating = true;
        }
    }
    else {
        if (bpp===32) {
            format = 'PIXELFORMAT_R8_G8_B8_A8';
        }
    }

    var headerSize = 128;
    var requiredMips = Math.round(log2(Math.max(width, height)) + 1);

    console.log('loadDDS', header[1], width, height, bpp, 'format:' + format, fcc, mips, requiredMips);

    //check for DX10 header
    if (fcc == 808540228) {
      var dx10Header = new Uint32Array(buf.slice(128, 128 + 20));
      headerSize = 128 + 20;
      console.log('loadDDS', 'DX10 Header found');
      var format = dx10Header[0];
      var resourceDimension = dx10Header[1];
      var miscFlag = dx10Header[2];
      var arraySize = dx10Header[3];
      var miscFlags2 = dx10Header[4];

      var D3D10_RESOURCE_DIMENSION_TEXTURE2D = 3;
      var DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
      if (resourceDimension == D3D10_RESOURCE_DIMENSION_TEXTURE2D && format == DXGI_FORMAT_R32G32B32A32_FLOAT) {
        floating = true;
        format = 'PIXELFORMAT_RGBA32F';
      }
      console.log('loadDDS DX10', format, resourceDimension, miscFlag, arraySize, miscFlags2);
    }

    var cantLoad = !format || (mips !== requiredMips && compressed);
    if (cantLoad) {
        var errEnd = ". Empty texture will be created instead.";
        if (!format) {
            console.error("This DDS pixel format is currently unsupported" + errEnd);
        } else {
            console.error("DDS has " + mips + " mips, but engine requires " + requiredMips + " for DXT format. " + errEnd);
        }
        return new TextureCube();
    }

    var texOptions = {
        width: width,
        height: height,
        format: format
    };


    var mipWidth = width;
    var mipHeight = height;
    var mipSize;

    console.log('loadDDS', width, height, 'mips:', mips, 'float:', floating);


    //http://msdn.microsoft.com/en-us/library/windows/desktop/bb205577(v=vs.85).aspx
    console.log('mips', mips);
    for(var j=0; j<6; j++) {
      for(var i=0; i<10; i++) {
          if (mips == 1 && i > 0) break;
        var mipWidth = width / Math.pow(2, i);
        var mipHeight = height / Math.pow(2, i);
        var bpp = floating ? 4 * 4 : 4;
        mipSize = mipWidth * mipHeight * bpp;
        var offset = headerSize;
        var mipIndex = i;
        if (mipIndex > mips - 1) mipIndex = mips - 1;
        //console.log(mipIndex, mipWidth);
        offset += width * height * bpp * (1 - Math.pow(0.25, mipIndex)) / (1 - 0.25);
        offset += j * width * height * bpp * (1 - Math.pow(0.25, mips)) / (1 - 0.25);
        console.log(j, i, offset)
      }
    }
}

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/SkyboxQuad.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/SkyboxQuad.frag') },
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        reflectionMap: { binary: ASSETS_DIR + '/envmaps/pisa_latlong_256.hdr' },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        //debugReflectionMap: { image: ASSETS_DIR + '/envmaps/pisa_preview_debug.jpg' },
        //debugReflectionMap: { image: ASSETS_DIR + '/envmaps/threejs_room.jpg' },
        //envMap_px:     { binary: ASSETS_DIR + '/envmaps/pisa_posx.hdr' },
        //envMap_nx:     { binary: ASSETS_DIR + '/envmaps/pisa_negx.hdr' },
        //envMap_py:     { binary: ASSETS_DIR + '/envmaps/pisa_posy.hdr' },
        //envMap_ny:     { binary: ASSETS_DIR + '/envmaps/pisa_negy.hdr' },
        //envMap_pz:     { binary: ASSETS_DIR + '/envmaps/pisa_posz.hdr' },
        //envMap_nz:     { binary: ASSETS_DIR + '/envmaps/pisa_negz.hdr' },
        //envMapImg_px:  { image: ASSETS_DIR + '/envmaps/top_px.png' },
        //envMapImg_nx:  { image: ASSETS_DIR + '/envmaps/top_nx.png' },
        //envMapImg_py:  { image: ASSETS_DIR + '/envmaps/top_py.png' },
        //envMapImg_ny:  { image: ASSETS_DIR + '/envmaps/top_ny.png' },
        //envMapImg_pz:  { image: ASSETS_DIR + '/envmaps/top_pz.png' },
        //envMapImg_nz:  { image: ASSETS_DIR + '/envmaps/top_nz.png' },
        //envMapImg_px:  { image: ASSETS_DIR + '/envmaps/bridge_posx.jpg' },
        //envMapImg_nx:  { image: ASSETS_DIR + '/envmaps/bridge_negx.jpg' },
        //envMapImg_py:  { image: ASSETS_DIR + '/envmaps/bridge_posy.jpg' },
        //envMapImg_ny:  { image: ASSETS_DIR + '/envmaps/bridge_negy.jpg' },
        //envMapImg_pz:  { image: ASSETS_DIR + '/envmaps/bridge_posz.jpg' },
        //envMapImg_nz:  { image: ASSETS_DIR + '/envmaps/bridge_negz.jpg' },
        pisa:          { binary: ASSETS_DIR + '/envmaps/temp/pisa_cubemap_32f.dds'}
    },
    roughness: 0.41,
    exposure: 1,
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('roughness', this, 'roughness');
        this.gui.addParam('exposure', this, 'exposure', { min: 0, max: 3});

        this.camera = new PerspCamera(60, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([-4, 1, 0], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uReflectionMap', 0);
        this.skyboxProgram.setUniform('uExposure', this.exposure);

        try {
            this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
            ctx.bindProgram(this.reflectionProgram);
            this.reflectionProgram.setUniform('uReflectionMap', 0);
            this.reflectionProgram.setUniform('uHammersleyPointSetMap', 1);
            this.reflectionProgram.setUniform('uExposure', this.exposure);
        }
        catch(e) {
            console.log(e);
        }

        this.debugDraw = new Draw(ctx);
        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        var numSamples = 1024;
        var hammersleyPointSet = new Float32Array(4 * numSamples);
        for(var i=0; i<numSamples; i++) {
            var p = hammersley(i, numSamples)
            hammersleyPointSet[i*4]   = p[0];
            hammersleyPointSet[i*4+1] = p[1];
            hammersleyPointSet[i*4+2] = 0;
            hammersleyPointSet[i*4+3] = 0;
        }

        this.hammersleyPointSetMap = ctx.createTexture2D(hammersleyPointSet, 1, numSamples, { type: ctx.FLOAT, magFilter: ctx.NEAREST, minFilter: ctx.NEAREST });

        //var hdrInfo = parseHdr(res.reflectionMap, res.reflectionMap.width, res.reflectionMap.height, { flip: true });
        ////this.reflectionMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.width, hdrInfo.height, { type: ctx.UNSIGNED_BYTE });
        //this.reflectionMap = ctx.createTexture2D(res.debugReflectionMap);
        //this.testReflectionMap = ctx.createTexture2D(res.debugReflectionMap);
        //this.watchShaders();
//
        //this.reflectionMap = ctx.createTextureCube([
        //    { face: 0, data: res.envMapImg_px},
        //    { face: 1, data: res.envMapImg_nx},
        //    { face: 2, data: res.envMapImg_py},
        //    { face: 3, data: res.envMapImg_ny},
        //    { face: 4, data: res.envMapImg_pz},
        //    { face: 5, data: res.envMapImg_nz}
        //], 256, 256)
        //this.reflectionMap = ctx.createTextureCube([
        //    { face: 0, data: parseHdr(res.envMap_px).data, width: 256, height: 256},
        //    { face: 1, data: parseHdr(res.envMap_nx).data, width: 256, height: 256},
        //    { face: 2, data: parseHdr(res.envMap_py).data, width: 256, height: 256},
        //    { face: 3, data: parseHdr(res.envMap_ny).data, width: 256, height: 256},
        //    { face: 4, data: parseHdr(res.envMap_pz).data, width: 256, height: 256},
        //    { face: 5, data: parseHdr(res.envMap_nz).data, width: 256, height: 256}
        //], 256, 256, { flip: true })

        var dds = parseDDS(res.pisa);
//
        //loadDDSCubemap(res.pisa)
//
        var numMipmaps = dds.images.length / 6;
        var faces = [];
        for(var i=0; i<6; i++) {
            var level = 0;
            var offset = i * numMipmaps + level;
            var img = dds.images[offset];
            var w = img.shape[0];
            var h = img.shape[1];
            //32 bit * 4 = 128 bit / 8 = 16 bytes
            //console.log
            var data = new Float32Array(res.pisa.slice(img.offset, img.offset + img.length));
            faces.push({ face: i, data: data, width: w, height:  h});
        }
//
        this.reflectionMap = ctx.createTextureCube(faces, 1024, 1024, { type: ctx.FLOAT })
//
        var skyboxPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
        var skyboxFaces = [ [0, 1, 2], [0, 2, 3]];
        var skyboxAttributes = [
            { data: skyboxPositions, location: ctx.ATTRIB_POSITION },
        ];
        var skyboxIndices = { data: skyboxFaces };
        this.skyboxMesh = ctx.createMesh(skyboxAttributes, skyboxIndices);

        var sphere = createSphere();
        var attributes = [
            { data: sphere.positions, location: ctx.ATTRIB_POSITION },
            { data: sphere.normals, location: ctx.ATTRIB_NORMAL },
            { data: sphere.uvs, location: ctx.ATTRIB_TEX_COORD_0 },
        ];
        var sphereIndices = { data: sphere.cells, usage: ctx.STATIC_DRAW };
        this.sphereMesh = ctx.createMesh(attributes, sphereIndices, ctx.TRIANGLES);
    },
    watchShaders: function() {
        fs.watchFile(__dirname + '/Reflection.frag', function() {
            console.log('File changed');
            glslify(__dirname + '/Reflection.frag').then(function(frag) {
                this.updateShaders(this.getResources().reflectionVert, frag);
            }.bind(this)).catch(function(e) {
                console.log(e)
            }).done();
        }.bind(this))
    },
    updateShaders: function(vert, frag) {
        console.log('updateShaders')
        var ctx = this.getContext();
        if (this.reflectionProgram) {
            this.reflectionProgram.dispose();
        }
        try {
            this.reflectionProgram = ctx.createProgram(vert, frag);
            ctx.bindProgram(this.reflectionProgram);
            this.reflectionProgram.setUniform('uReflectionMap', 0);
            this.reflectionProgram.setUniform('uHammersleyPointSetMap', 1);
            this.reflectionProgram.setUniform('uExposure', this.exposure);
        }
        catch(e) {
            console.log(e);
            this.reflectionProgram = null;
        }
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindTexture(this.reflectionMap, 0);
        ctx.bindTexture(this.hammersleyPointSetMap, 1);

        //move skybox to the camera position
        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uExposure', this.exposure);
        ctx.bindMesh(this.skyboxMesh);
        ctx.drawMesh();

        if (this.reflectionProgram) {
            ctx.setDepthTest(true);
            ctx.bindProgram(this.reflectionProgram);
            this.reflectionProgram.setUniform('uExposure', this.exposure);
            this.reflectionProgram.setUniform('uRoughness', this.roughness);
            ctx.bindMesh(this.sphereMesh);
            ctx.drawMesh();
        }

        ctx.bindProgram(this.showColorsProgram);
        this.debugDraw.drawPivotAxes(2);

        this.gui.draw();
    }
})
