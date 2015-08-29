var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var isBrowser    = require('is-browser');

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        skyboxVert: { glsl: glslify(__dirname + '/Skybox.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/Skybox.frag') },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        lake_px:     { image: __dirname + '/../assets/envmaps/lake_right.jpg' },
        lake_nx:     { image: __dirname + '/../assets/envmaps/lake_left.jpg' },
        lake_py:     { image: __dirname + '/../assets/envmaps/lake_top.jpg' },
        lake_ny:     { image: __dirname + '/../assets/envmaps/lake_bottom.jpg' },
        lake_pz:     { image: __dirname + '/../assets/envmaps/lake_back.jpg' }, //+x is 'back'!
        lake_nz:     { image: __dirname + '/../assets/envmaps/lake_front.jpg' }//-z is 'front'!
    },
    init: function() {
        var ctx = this.getContext();

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 20);
        this.camera.lookAt([0, 1, 4], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.modelMatrix = Mat4.create();
        ctx.setModelMatrix(this.modelMatrix);

        var res = this.getResources();

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);

        var g = createSphere();
        var attributes = [
            { data: g.positions, location: ctx.ATTRIB_POSITION },
            { data: g.normals, location: ctx.ATTRIB_NORMAL }
        ];
        var indices = { data: g.cells };
        this.mesh = ctx.createMesh(attributes, indices, ctx.TRIANGLES);

        var cube = createCube(20);
        this.skyboxMesh = ctx.createMesh(
            [ { data: cube.positions, location: ctx.ATTRIB_POSITION }],
            { data: cube.cells },
            ctx.TRIANGLES
        );

        this.reflectionMap = ctx.createTextureCube([
            { face: 0, data: res.lake_px },
            { face: 1, data: res.lake_nx },
            { face: 2, data: res.lake_py },
            { face: 3, data: res.lake_ny },
            { face: 4, data: res.lake_pz },
            { face: 5, data: res.lake_nz }
        ])
    },
    draw: function() {
        var ctx = this.getContext();

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindTexture(this.reflectionMap, 0);

        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uReflectionMap', 0);
        ctx.setCullFace(true);
        ctx.setCullFaceMode(ctx.FRONT);
        ctx.pushModelMatrix();
            ctx.translate(this.camera.getPosition());
            ctx.bindMesh(this.skyboxMesh);
            ctx.drawMesh();
        ctx.popModelMatrix();
        ctx.setCullFaceMode(ctx.BACK);

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uReflectionMap', 0);
        ctx.bindMesh(this.mesh);
        ctx.drawMesh();
    }
})
