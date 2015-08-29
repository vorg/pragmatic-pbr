var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var parseHdr     = require('../local_modules/parse-hdr');
var isBrowser    = require('is-browser');
var GUI          = require('pex-gui');

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
        reflectionMap: { binary: __dirname + '/../assets/envmaps/uffizi.hdr' }
    },
    init: function() {
        var ctx = this.getContext();

        this.model = Mat4.create();
        this.projection = Mat4.perspective(Mat4.create(), 60, this.getAspectRatio(), 0.001, 100.0);
        this.cameraPos = [3, -1, 2];
        this.view = Mat4.lookAt([], this.cameraPos, [0, 0, 0], [0, 1, 0]);
        this.invView = Mat4.create();
        Mat4.set(this.invView, this.view);
        Mat4.invert(this.invView);

        ctx.setProjectionMatrix(this.projection);
        ctx.setViewMatrix(this.view);
        ctx.setModelMatrix(this.model);

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uReflectionMap', 0);

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uReflectionMap', 0);

        var hdrInfo = parseHdr(res.reflectionMap);
        this.reflectionMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.width, hdrInfo.height, { type: ctx.UNSIGNED_BYTE });

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
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        ctx.setViewMatrix(this.view);

        ctx.bindTexture(this.reflectionMap, 0);

        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        ctx.bindMesh(this.skyboxMesh);
        ctx.drawMesh();

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uInvViewMatrix', this.invView);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();


    }
})
