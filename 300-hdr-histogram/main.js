var plask = require('plask');
var parseHdr = require('../local_modules/parse-hdr/');
var loadBinary = require('pex-io/loadBinary');

var ASSETS_DIR = __dirname + '/../assets';

var SkCanvas = plask.SkCanvas;
var img = SkCanvas.createFromImage(ASSETS_DIR + '/envmaps/pisa_preview.jpg');

var imgHdr;
loadBinary(ASSETS_DIR + '/envmaps/pisa_latlong_256.hdr', function(err, hdr) {
    imgHdr = parseHdr(hdr);
})

plask.simpleWindow({
    settings: {
        width: 800,
        height: 2 * (800/img.width*img.height) | 0,
        type: '2d'
    },
    y: 0,
    init: function() {
        this.framerate(10);
        this.on('mouseMoved', function(e) {
            this.y = e.y/this.height;
        }.bind(this))
    },
    draw: function() {
        this.imgHistogram();
        this.hdrHistogram();
    },
    imgHistogram: function() {
        var canvas = this.canvas;
        var paint = this.paint;
        canvas.drawCanvas(paint, img, 0, 0, this.width, this.height/2);

        paint.setColor(255, 0, 0, 255);
        paint.setFill();
        var y = (this.y * img.height) | 0;
        for(var i=1; i<img.width; i++) {
            var idx = (y * img.width + i) * 4;
            var r = img[idx+2]/255;
            var g = img[idx+1]/255;
            var b = img[idx+0]/255;
            r = Math.pow(r, 2.2);
            g = Math.pow(g, 2.2);
            b = Math.pow(b, 2.2);
            var lum = (255*r/3 + 255*g/3 + 255*b/3) | 0;
            lum /= 2;
            canvas.drawRect(paint, i*this.width/img.width, this.height/2, i*this.width/img.width+1, this.height/2 - lum)
        }

        y = this.y * this.height/2;
        canvas.drawRect(paint, 0, y, img.width, y + 2);
    },
    hdrHistogram: function() {
        var canvas = this.canvas;
        var paint = this.paint;
        canvas.drawCanvas(paint, img, 0, this.height/2, this.width, this.height);

        var width = imgHdr.shape[0];
        var height = imgHdr.shape[1];
        var pixels = imgHdr.data;

        paint.setColor(255, 150, 0, 255);
        paint.setFill();
        var y = (this.y * height) | 0;
        for(var i=1; i<width; i++) {
            var idx = (y * width + i) * 4;
            var r = pixels[idx+2];
            var g = pixels[idx+1];
            var b = pixels[idx+0];
            var lum = (255*r/3 + 255*g/3 + 255*b/3) | 0;
            lum /= 2;
            canvas.drawRect(paint, i*this.width/width, this.height/2 + this.height/2, i*this.width/width+1, this.height/2 + this.height/2 - lum)
        }

        paint.setColor(255, 255, 0, 255);
        paint.setFill();
        for(var i=1; i<width; i++) {
            var idx = (y * width + i) * 4;
            var r = pixels[idx+2];
            var g = pixels[idx+1];
            var b = pixels[idx+0];

            r = r/(1+r);
            g = g/(1+g);
            b = b/(1+b);

            var lum = (255*r/3 + 255*g/3 + 255*b/3) | 0;
            lum /= 2;
            canvas.drawRect(paint, i*this.width/width, this.height/2 + this.height/2, i*this.width/width+1, this.height/2 + this.height/2 - lum)
        }

        y = this.y * this.height/2;
        canvas.drawRect(paint, 0, this.height/2 + y, this.width, this.height/2 + y + 1);
    },
    imgHistogramOld: function() {
        var canvas = this.canvas;
        var paint = this.paint;
        canvas.drawCanvas(paint, img, 0, 0, this.width, this.height/2);
        var numPixels = img.width * img.height;
        var len = numPixels * 4;

        var maxLuma = 0;
        var buckets = [];
        for(var i=0; i<len; i+=4) {
            //format is BGR not RGB
            var r = img[i+2];
            var g = img[i+1];
            var b = img[i+0];

            //map to 0..1
            var lum = r/255/3 + g/255/3 + b/255/3;

            var lumaInt = (lum * 255) | 0;
            maxLuma = Math.max(maxLuma, lumaInt);
            buckets[lumaInt] = buckets[lumaInt] ? buckets[lumaInt] + 1 : 1;
        }

        for(var i=0; i<maxLuma; i++) {
            if (!buckets[lumaInt]) buckets[lumaInt] = 0;
            buckets[i] /= numPixels;
        }

        paint.setColor(255, 0, 0, 255);
        paint.setFill();
        for(var i=1; i<maxLuma; i++) {
            canvas.drawRect(paint, i, this.height/2, i+1, this.height/2 - buckets[i] * this.height/2*10)
        }
    },
    hdrHistogram2: function() {
        var canvas = this.canvas;
        var paint = this.paint;

        canvas.save();
        //canvas.translate(0, this.height/2);

        console.log()

        var width = imgHdr.shape[0];
        var height = imgHdr.shape[1];
        var pixels = imgHdr.data;

        //canvas.drawCanvas(paint, img, 0, 0, this.width, this.height/2);
        var numPixels = width * height;
        var len = numPixels * 4;

        console.log(len, pixels.length)

        var maxLuma = 0;
        var minLuma = 0;
        var buckets = [];
        for(var i=1; i<len; i+=4) {
            //format is BGR not RGB
            var r = pixels[i+2];
            var g = pixels[i+1];
            var b = pixels[i+0];

            //r = Math.pow(2.2, r);
            //g = Math.pow(2.2, g);
            //b = Math.pow(2.2, b);

            //r = 1/(1+r);
            //g = 1/(1+g);
            //b = 1/(1+b);

            //map to 0..1
            var lum = r/3 + g/3 + b/3;

            var lumaInt = (lum * 255) | 0;

            maxLuma = Math.max(maxLuma, lumaInt);
            minLuma = Math.min(minLuma, lumaInt);
            buckets[lumaInt] = buckets[lumaInt] ? buckets[lumaInt] + 1 : 1;
            if (isNaN(buckets[lumaInt])) {
                console.lg(r, g, b);
            }
        }

        for(var i=0; i<maxLuma; i++) {
            if (!buckets[i]) buckets[i] = 0;
            buckets[i] /= numPixels;
        }

        paint.setColor(255, 255, 0, 255);
        paint.setFill();
        canvas.drawRect(paint, i, 0, i+1, 20)
        for(var i=0; i<maxLuma; i++) {
            canvas.drawRect(paint, i, this.height/2, i+1, this.height/2 - buckets[i] * this.height/2*10)
        }

        canvas.restore();
    }
})
