//TODO: simplified textured cube
//http://gamedev.stackexchange.com/questions/60313/implementing-a-skybox-with-glsl-version-330
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

var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

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
        reflectionMap: { binary: ASSETS_DIR + '/envmaps/pisa_256.hdr' },
        debugReflectionMap: { image: ASSETS_DIR + '/envmaps/test.jpg' }
    },
    roughness: 0.01,
    exposure: 1,
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('roughness', this, 'roughness');
        this.gui.addParam('exposure', this, 'exposure');

        this.camera = new PerspCamera(60, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 1, 4], [0, 0, 0], [0, 1, 0]);
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

        var numSamples = 256;
        var hammersleyPointSet = new Float32Array(4 * numSamples);
        for(var i=0; i<numSamples; i++) {
            var p = hammersley(i, numSamples)
            hammersleyPointSet[i*4] = p[0];
            hammersleyPointSet[i*4+1] = p[1];
            hammersleyPointSet[i*4+2] = 0;
            hammersleyPointSet[i*4+3] = 0;
        }

        this.hammersleyPointSetMap = ctx.createTexture2D(hammersleyPointSet, 1, numSamples, { type: ctx.FLOAT, magFilter: ctx.NEAREST, minFilter: ctx.NEAREST });

        var hdrInfo = parseHdr(res.reflectionMap);
        this.reflectionMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.width, hdrInfo.height, { type: ctx.UNSIGNED_BYTE });
        this.testReflectionMap = ctx.createTexture2D(res.debugReflectionMap);
        this.watchShaders();

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
        //ctx.bindTexture(this.testReflectionMap, 0);
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

        this.gui.draw();
    }
})
