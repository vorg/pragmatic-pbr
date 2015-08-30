//based on http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
var bits = new Uint32Array(1);
function radicalInverse_VdC(i) {
    bits[0] = i;
    bits[0] = ((bits[0] << 16) | (bits[0] >> 16))>>>0;
    bits[0] = ((bits[0] & 0x55555555) << 1) | ((bits[0] & 0xAAAAAAAA) >>> 1) >>>0;
    bits[0] = ((bits[0] & 0x33333333) << 2) | ((bits[0] & 0xCCCCCCCC) >>> 2) >>>0;
    bits[0] = ((bits[0] & 0x0F0F0F0F) << 4) | ((bits[0] & 0xF0F0F0F0) >>> 4) >>>0;
    bits[0] = ((bits[0] & 0x00FF00FF) << 8) | ((bits[0] & 0xFF00FF00) >>> 8) >>>0;
    return bits[0] * 2.3283064365386963e-10; // / 0x100000000 or / 4294967296
}

function radicalInverse_VdC2(a) {
    a = (a<<16 | a>>>16)>>>0;
    a = ((a & 1431655765)<<1 | (a & 2863311530)>>>1)>>>0;
    a = ((a & 858993459)<<2 | (a & 3435973836)>>>2)>>>0;
    a = ((a & 252645135)<<4 | (a & 4042322160)>>>4)>>>0;
    return (((a & 16711935)<<8 | (a & 4278255360)>>>8)>>>0) / 4294967296
}

function hammersley(i, n) {
    return [i/n, radicalInverse_VdC(i)];
}

module.exports = hammersley;
