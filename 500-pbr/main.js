var Window       = require('pex-sys/Window');
var createSphere = require('primitive-sphere');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var Draw         = require('pex-draw');
var glslify      = require('glslify-promise');
var Texture2D    = require('pex-context/Texture2D');
var TextureCube  = require('pex-context/TextureCube');
var GUI          = require('pex-gui');

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
        showNormalsVert: { text: __dirname + '/glsl/ShowNormals.vert' },
        showNormalsFrag: { text: __dirname + '/glsl/ShowNormals.frag' },
        showColorsVert: { text: __dirname + '/glsl/ShowColors.vert' },
        showColorsFrag: { text: __dirname + '/glsl/ShowColors.frag' },
        specularPhongVert: { glsl: glslify(__dirname + '/glsl/SpecularPhong.vert') },
        specularPhongFrag: { glsl: glslify(__dirname + '/glsl/SpecularPhong.frag') }
    },
    init: function() {
        this.initMeshes();
        this.initMaterials();
        this.initGUI();
        this.initCamera();
    },
    initCamera: function() {
        this.camera = new PerspCamera(45, viewports[0][2] / viewports[0][3], 0.1, 100);
        this.camera.lookAt([4, 4, 4], [0, 0, 0], [0, 1, 0]);
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
            name: 'normals',
            program: ctx.createProgram(res.showNormalsVert, res.showNormalsFrag)
        })

        materials.push({
            name: 'blinnPhong',
            program: ctx.createProgram(res.specularPhongVert, res.specularPhongFrag),
            uniforms: {
                uRoughness: 0.5,
                uRoughnessParams: { min: 0.01, max: 1 },
                uLightPosition: [10, 10, 0]
            }
        })
                uLightPosition: [10, 10, 0]
            }
        })

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag)

        this.debugDraw = new Draw(ctx);
    },
    initGUI: function() {
        var ctx = this.getContext();

        var gui = this.gui = new GUI(ctx, W, H);
        this.addEventListener(gui)

        materials.forEach(function(material, i) {
            var viewport = viewports[i];
            gui.addHeader(material.name).setPosition(viewport[0] + 2, viewport[1] + 2)
            for(var unifornName in material.uniforms) {
                var params = material.uniforms[unifornName + 'Params'];
                if (params) {
                    gui.addParam(unifornName, material.uniforms, unifornName, { min: params.min, max: params.max });
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
