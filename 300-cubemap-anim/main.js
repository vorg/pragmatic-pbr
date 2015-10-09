var Window = require('pex-sys/Window');
var Mat4 = require('pex-math/Mat4');
var Vec3 = require('pex-math/Vec3');
var isBrowser = require('is-browser');
var PerspCamera = require('pex-cam/PerspCamera');
var Arcball = require('pex-cam/Arcball');
var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

var VERT = '\
attribute vec4 aPosition;\
attribute vec2 aTexCoord0; \
uniform mat4 uProjectionMatrix; \
uniform mat4 uViewMatrix; \
uniform mat4 uModelMatrix; \
varying vec2 vTexCoord; \
void main() { \
  vTexCoord = aTexCoord0; \
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition; \
} \
';

var FRAG = '\
varying vec2 vTexCoord; \
uniform sampler2D uTexture; \
void main() {\
    gl_FragColor = texture2D(uTexture, vTexCoord); \
}\
';

if (isBrowser) {
    FRAG = 'precision highp float;' + '\n' + FRAG;
}

Window.create({
    settings: {
        width: 1270,
        height: 720
    },
    resources: {
        test_px: { image: ASSETS_DIR + '/envmaps/test_px.png' },
        test_nx: { image: ASSETS_DIR + '/envmaps/test_nx.png' },
        test_py: { image: ASSETS_DIR + '/envmaps/test_py.png' },
        test_ny: { image: ASSETS_DIR + '/envmaps/test_ny.png' },
        test_pz: { image: ASSETS_DIR + '/envmaps/test_pz.png' },
        test_nz: { image: ASSETS_DIR + '/envmaps/test_nz.png' },
        pisa_px: { image: ASSETS_DIR + '/envmaps/pisa_posx.jpg' },
        pisa_nx: { image: ASSETS_DIR + '/envmaps/pisa_negx.jpg' },
        pisa_py: { image: ASSETS_DIR + '/envmaps/pisa_posy.jpg' },
        pisa_ny: { image: ASSETS_DIR + '/envmaps/pisa_negy.jpg' },
        pisa_pz: { image: ASSETS_DIR + '/envmaps/pisa_posz.jpg' },
        pisa_nz: { image: ASSETS_DIR + '/envmaps/pisa_negz.jpg' },
    },
    init: function() {
        var ctx = this.getContext();
        var positions = [[-0.5, -0.5], [0.5,-0.5], [ 0.5, 0.5], [-0.5,0.5]];
        var texCoords = [[0, 0], [1, 0], [1, 1], [0, 1]];
        var faces = [[0, 1, 2], [0, 2, 3]];
        this.mesh = ctx.createMesh([
            { location: ctx.ATTRIB_POSITION, data: positions },
            { location: ctx.ATTRIB_TEX_COORD_0, data: texCoords}
        ], { data: faces });

        var res = this.getResources();
        this.faces = [
            { tex: ctx.createTexture2D(res.test_nx, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_nx, 0, 0, { flip: true }) },
            { tex: ctx.createTexture2D(res.test_pz, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_pz, 0, 0, { flip: true }) },
            { tex: ctx.createTexture2D(res.test_px, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_px, 0, 0, { flip: true }) },
            { tex: ctx.createTexture2D(res.test_nz, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_nz, 0, 0, { flip: true }) },
            { tex: ctx.createTexture2D(res.test_py, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_py, 0, 0, { flip: true }) },
            { tex: ctx.createTexture2D(res.test_ny, 0, 0, { flip: true }), tex2: ctx.createTexture2D(res.pisa_ny, 0, 0, { flip: true }) }
        ];

        this.program = ctx.createProgram(VERT, FRAG);

        this.viewMatrix = Mat4.lookAt(Mat4.create(), [0,0,5], [0,0,0],[0,1,0]);
        this.projectionMatrix = Mat4.perspective(Mat4.create(), 45, this.getAspectRatio(), 0.1, 100);

        //this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 100);
        //this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        //this.addEventListener(this.arcball);

        ctx.setViewMatrix(this.viewMatrix);
        ctx.setProjectionMatrix(this.projectionMatrix);

        //ctx.setViewMatrix(this.camera.getViewMatrix());
        //ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        //
        this.angle = 0;
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(1,1,1,1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        ctx.bindProgram(this.program);
        this.program.setUniform('uTexture', 0);
        ctx.bindMesh(this.mesh);

        //this.arcball.apply();
        //ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.pushModelMatrix();

        this.angle -= 0.5*this.getTime().getDeltaSeconds();
        var angle = this.angle;

        if (angle < -Math.PI/2) {
            angle = -Math.PI/2;
            this.angle = 0;
        }

        var posY = -angle * 2;

        this.viewMatrix = Mat4.lookAt(Mat4.create(), [posY,posY,5], [0,0,0],[0,1,0]);
        ctx.setViewMatrix(this.viewMatrix);

        ctx.translate([-1, 0, 0])

        var debug = false;

        ctx.pushModelMatrix();
        ctx.bindTexture(debug ? this.faces[0].tex : this.faces[0].tex2);
        ctx.translate([0.5, 0, 0])
        ctx.rotate(-angle, [0, 1, 0]);
        ctx.translate([-0.5, 0, 0])
        ctx.drawMesh();
        ctx.popModelMatrix();

        ctx.bindTexture(debug ? this.faces[1].tex : this.faces[1].tex2);
        ctx.translate([0.5, 0, 0])
        ctx.translate([+0.5, 0, 0])
        ctx.drawMesh();

        ctx.pushModelMatrix();
        ctx.bindTexture(debug ? this.faces[4].tex : this.faces[4].tex2);
        ctx.translate([0, 0.5, 0])
        ctx.rotate(-angle, [1, 0, 0]);
        ctx.translate([0, 0.5, 0])
        ctx.drawMesh();
        ctx.popModelMatrix();

        ctx.pushModelMatrix();
        ctx.bindTexture(debug ? this.faces[5].tex : this.faces[5].tex2);
        ctx.translate([0, -0.5, 0])
        ctx.rotate( angle, [1, 0, 0]);
        ctx.translate([0, -0.5, 0])
        ctx.drawMesh();
        ctx.popModelMatrix();

        ctx.bindTexture(debug ? this.faces[2].tex : this.faces[2].tex2);
        ctx.translate([0.5, 0, 0])
        ctx.rotate(angle, [0, 1, 0]);
        ctx.translate([+0.5, 0, 0])
        ctx.drawMesh();

        ctx.bindTexture(debug ? this.faces[3].tex : this.faces[3].tex2);
        ctx.translate([0.5, 0, 0])
        ctx.rotate(angle, [0, 1, 0]);
        ctx.translate([+0.5, 0, 0])
        ctx.drawMesh();

        this.faces.forEach(function(face) {
        }.bind(this))
        ctx.popModelMatrix();
    }
})
