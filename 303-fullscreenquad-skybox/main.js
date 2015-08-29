//TODO: simplified textured cube
//http://gamedev.stackexchange.com/questions/60313/implementing-a-skybox-with-glsl-version-330
var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var isBrowser    = require('is-browser');

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
        reflectionMap: { image: __dirname + '/../assets/envmaps/test.jpg' }
    },
    init: function() {
        var ctx = this.getContext();

        this.camera = new PerspCamera(60, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 1, 4], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.modelMatrix = Mat4.create();
        ctx.setModelMatrix(this.modelMatrix);

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uReflectionMap', 0);

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uReflectionMap', 0);

        this.reflectionMap = ctx.createTexture2D(res.reflectionMap, res.reflectionMap.width, res.reflectionMap.height);

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

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindTexture(this.reflectionMap, 0);

        //move skybox to the camera position
        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        ctx.bindMesh(this.skyboxMesh);
        ctx.drawMesh();

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();
    }
})
