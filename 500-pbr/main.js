var Window       = require('pex-sys/Window');
var createSphere = require('primitive-sphere');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');


function grid(w, h, nw, nh, margin){
    margin = margin || 0;
    var max =  nw * nh;
    var cw = Math.floor(w / nw);
    var ch = Math.floor(h / nh);
    var cells = [];
    for(var y = 0; y < nh; ++y){
        for(var x = 0; x < nw; ++x){
            cells.push([
                x * cw + margin,
                y * ch + margin,
                cw - 2 * margin,
                ch - 2 * margin
            ]);
        }
    }
    return cells;
}

var W = 1280;
var H = 720;

var viewports = grid(W, H, 4, 3);
var materials = [];

Window.create({
    settings: {
        width: 1280,
        height: 720
    },
    resources: {
        showNormalsVert: { text: __dirname + '/materials/ShowNormals.vert' },
        showNormalsFrag: { text: __dirname + '/materials/ShowNormals.frag' }
    },
    init: function() {
        this.initCamera();
        this.initMeshes();
        this.initMaterials();
    },
    initCamera: function() {
        this.camera = new PerspCamera(45, viewports[0][2] / viewports[0][3], 0.1, 100);
        this.camera.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
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
    },
    initMaterials: function() {
        var ctx = this.getContext();
        var res = this.getResources();

        materials.push({
            program: ctx.createProgram(res.showNormalsVert, res.showNormalsFrag)
        })
    },
    draw: function() {
        var ctx = this.getContext();

        this.arcball.apply();
        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.setDepthTest(true);

        for(var i in viewports) {
            var viewport = viewports[i];
            var material = materials[i % materials.length];

            var c = 0.1 * i/viewports.length;
            ctx.pushState(ctx.VIEWPORT_BIT | ctx.SCISSOR_BIT);
            //flipping Y as viewport starts in bottom left
            ctx.setViewport(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setScissorTest(true)
            ctx.setScissor(viewport[0], H - viewport[1] - viewport[3], viewport[2], viewport[3])
            ctx.setClearColor(c, c, c, 0.0);
            ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

            ctx.bindProgram(material.program);
            ctx.bindMesh(this.sphereMesh);
            ctx.drawMesh();

            ctx.popState(ctx.VIEWPORT_BIT | ctx.SCISSOR_BIT);
        }

    }
})
