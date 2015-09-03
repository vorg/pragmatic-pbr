var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var parseHdr     = require('../local_modules/parse-hdr');
var isBrowser    = require('is-browser');
var GUI          = require('pex-gui');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        envMap: { binary: __dirname + '/../assets/envmaps/pisa_latlong_256.hdr' }
    },
    init: function() {
        var ctx = this.getContext();

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 50);
        this.camera.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        var res = this.getResources();

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uEnvMap', 0);

        var hdrInfo = parseHdr(res.envMap);
        this.envMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.width, hdrInfo.height, { type: ctx.UNSIGNED_BYTE });

        var cube = createCube(20);
        this.skyboxMesh = ctx.createMesh(
            [ { data: cube.positions, location: ctx.ATTRIB_POSITION }],
            { data: cube.cells },
            ctx.TRIANGLES
        );

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
        ctx.setCullFace(true);

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindTexture(this.envMap, 0);
        ctx.bindProgram(this.reflectionProgram);

        ctx.setDepthTest(false);
        ctx.setCullFaceMode(ctx.FRONT);
        ctx.pushModelMatrix();
            ctx.translate(this.camera.getPosition());
            ctx.bindMesh(this.skyboxMesh);
            ctx.drawMesh();
        ctx.popModelMatrix();

        ctx.setDepthTest(true);
        ctx.setCullFaceMode(ctx.BACK);

        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();
    }
})
