//Import all the dependencies
var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');

//Create window - in the borwser this will:
//- create new Canvas element with width/height specified in the `settings`
//- append it to <body>
//- get WebGL context
//- add event listeners for mouse and keyboard events
//- load all requested resources
//- call init()
//- keep calling draw() using Window.requestAnimationFrame()
Window.create({
    //Window / canvas properties
    settings: {
        width: 1024,
        height: 576
    },
    //Files (text, json, glsl vis glslify, images) to load before init
    resources: {
        vert: { glsl: glslify(__dirname + '/Material.vert') },
        frag: { glsl: glslify(__dirname + '/Material.frag') }
    },
    //Init is called after creating WebGL context and successfuly loading all the resources
    init: function() {
        //pex-context/Context object - the pex's WebGL context wrapper
        var ctx = this.getContext();

        //Model transformation matrix
        //An Array with 16 numbers initialized to an identity matrix
        this.model = Mat4.create();

        //Camera projection matrix
        this.projection = Mat4.perspective(
            Mat4.create(),             //new matrix
            45,                        //45' deg fov
            this.getAspectRatio(),     //window aspect ratio width/height
            0.001,                     //near clipping plane
            10.0                       //far clipping plane
        );

        //Camera view matrix
        this.view = Mat4.create();
        //[0,1,5] - eye position
        //[0,0,0] - target position
        //[0,1,0] - camera up vector
        Mat4.lookAt(this.view, [0, 1, 5], [0, 0, 0], [0, 1, 0]);

        //The Context keeps a separate matrix stack for the projection,
        //view and model matrix. Additionaly it will compute normal matrix
        //and inverse view matrix whenever view matrix changes
        ctx.setProjectionMatrix(this.projection);
        ctx.setViewMatrix(this.view);
        ctx.setModelMatrix(this.model);

        //Get reference to all loaded resources
        var res = this.getResources();

        //Each resource of type `glsl` will be replace by string with the loaded GLSL code
        //We can use that code to create a WebGL Program object
        this.program = ctx.createProgram(res.vert, res.frag);

        //Create sphere geometry - an object with positions, normals and cells/faces
        var g = createSphere();

        //Definie mesh attribute layout
        //ATTRIB_POSITION and ATTRIB_NORMAL are slot numbers
        //matching attributes in the shader aPosition and aNormal
        var attributes = [
            { data: g.positions, location: ctx.ATTRIB_POSITION },
            { data: g.normals, location: ctx.ATTRIB_NORMAL }
        ];

        //Define vertices data
        var indices = { data: g.cells };

        //Create mesh to be rendered as a list of TRIANGLEs
        this.mesh = ctx.createMesh(attributes, indices, ctx.TRIANGLES);
    },
    //This function is called as close as possible to 60fps via requestAnimationFrame
    draw: function() {
        var ctx = this.getContext();

        //Set gl clear color to dark grey
        ctx.setClearColor(0.2, 0.2, 0.2, 1);

        //Clear the color and depth buffers
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        //Enable depth testing
        ctx.setDepthTest(true);

        //Activate our GLSL program
        ctx.bindProgram(this.program);

        //Set the light's position uniform
        //There is no need to set matrix uniforms like uProjectionMatrix as
        //these are handled by the context. List of all handled uniforms is
        //in pex-context/ProgramUniform.js
        this.program.setUniform('uLightPos', [10, 10, 10])

        //Activate the sphere mesh
        ctx.bindMesh(this.mesh);

        //Draw the currently active mesh (sphere in this example)
        ctx.drawMesh();
    }
})
