var SEMITONE_INTERVAL_MULTIPLIER = 1.05946309435929526456;

/*
 *  isto está absolutamente atroz
 *
 */

function applyIntervalToFreq(freq, interval) {
    return freq * Math.pow(SEMITONE_INTERVAL_MULTIPLIER, interval);
}

function intervalBetweenFreqs(freq1, freq2) {
    return Math.log(freq2 / freq1) / Math.log(SEMITONE_INTERVAL_MULTIPLIER);
}

var NMAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
//var NMINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
//var DHARMONIC_SCALE = [0, 1, 4, 5, 7, 8, 11];
var PSEUDOINDIAN_22_SCALE = [0.0, 0.5455, 1.091, 1.6364999999999998, 2.182, 2.7275, 3.2729999999999997, 3.8185, 4.364, 4.9094999999999995, 5.455, 6.0005, 6.545999999999999, 7.0915, 7.637, 8.1825, 8.728, 9.2735, 9.818999999999999, 10.3645, 10.91, 11.455499999999999];
var SILLY_SCALE = [0];
for (var i = 0; i < 5; i++) {
    var n = SILLY_SCALE[SILLY_SCALE.length - 1];
    for (var j = 0; j < 5; j++)
        SILLY_SCALE.push(n++);
    for (var j = 0; j < 4; j++)
        SILLY_SCALE.push(n--);
}


function forceIntervalOnScale(reference, relative, scale) {
    var interval = reference + relative;
    var base = Math.floor(interval / 12) * 12;
    interval = interval % 12;
    for (var i = 0; i < (scale.length - 1); i++) {
        var leftDiff = interval - scale[i];
        var rightDiff = scale[i + 1] - interval;
        if ((leftDiff >= 0) && (rightDiff >= 0)) {
            return base + (leftDiff < rightDiff ? scale[i] : scale[i + 1]);
            //return scale[i];
        }
    }
    return base + scale[scale.length - 1];
}

function harmonyFactors(params) {
    var freq1v = params.freq1;
    var freq2v = params.freq2;
    var freq1Min = params.freq1_min;
    var freq1Max = params.freq1_max;
    var freq2Min = params.freq2_min;
    var freq2Max = params.freq2_max;
    var relFreq1 = (freq1v - freq1Min) / (freq1Max - freq1Min);
    var relFreq2 = (freq2Max == freq2Min ? 1.0 : (freq2v - freq2Min) / (freq2Max - freq2Min));

    var interval = intervalBetweenFreqs(
            Math.min(params.freq1, params.freq2),
            Math.max(params.freq1, params.freq2));
    var truncInterval = Math.round(interval);
    var modTruncInterval = truncInterval % 12;
    var roundness = 1.0 - Math.abs(interval - truncInterval);
    var harmony = truncInterval;
    if (modTruncInterval === 0)
        harmony = 1.0;
    else if (modTruncInterval === 7)
        harmony = 0.9;
    else if (modTruncInterval === 5)
        harmony = 0.8;
    else if (modTruncInterval === 4)
        harmony = 0.7;
    else if (modTruncInterval === 3)
        harmony = 0.6;
    else if (modTruncInterval === 2)
        harmony = 0.5;
    else
        harmony = 0.4;
    return [roundness, harmony, relFreq2, truncInterval, params.baseColor];
}

function harmonyFactorsToColor(factors) {
    var roundness = factors[0];
    var harmony = factors[1];
    var relFreqFactor = Math.max(0, Math.min(1, factors[2]));
    var truncInterval = factors[3];
    var baseColor = factors[4];
    var red = baseColor[0] * (0.3 + (0.7 * Math.pow((1.0 - relFreqFactor), 2)));
    var green = baseColor[1] * (0.3 + (0.7 * Math.pow((1.0 - relFreqFactor), 2)));
    var blue = baseColor[2] * (0.3 + (0.7 * Math.pow((1.0 - relFreqFactor), 2)));
    /*var green = Math.min(255, baseColor[1] + thing);
    var blue = Math.max(0, Math.min(255, baseColor[2] + (baseColor[1] + thing) - 255));*/
    return [(roundness * red), (roundness * green), (roundness * blue)];
}

var freq1 = 261.626;
var freq2 = 261.626;
var quadrantWeights = [0.75, 0.25, 0.0, 0.0];
/*var synth1, synth2;

synth1 = T("saw", {freq:freq1, mul:0.5, cellsize:32});
//synth2 = T("saw", {freq:freq2, mul:0.5});

function start() {
    synth1.play();
//    synth2.play();
}

function stop() {
    synth1.pause();
//    synth2.pause();
}
*/

function compositeTone() {
    var phase1 = 0;
    var phase2 = 0;

    return function(e) {
        var phaseIncr1 = freq1 / Pico.sampleRate;
        var phaseIncr2 = freq2 / Pico.sampleRate;
        var out = e.buffers;

        for (var i = 0; i < e.bufferSize; i++) {
            out[0][i] =
                (Math.sin(2 * Math.PI * phase1) * quadrantWeights[0]) +
                (sawfunction(2 * Math.PI * phase1) * 0.5 * quadrantWeights[1]) +
                (squarefunction(2 * Math.PI * phase1) * 0.5 * quadrantWeights[2]);
            out[1][i] =
                (Math.sin(2 * Math.PI * phase2) * quadrantWeights[0]) +
                (sawfunction(2 * Math.PI * phase2) * 0.5 * quadrantWeights[1]) +
                (squarefunction(2 * Math.PI * phase2) * 0.5 * quadrantWeights[2]);
            phase1 += phaseIncr1;
            phase2 += phaseIncr2;
        }
    };
}

function sawfunction(phase) {
    return ((phase / (2 * Math.PI)) % 1.0) - 0.5;
}

function squarefunction(phase) {
    return (Math.sin(phase) < 0 ? -1.0 : 1.0);
}

var synthToggle = false;
function toggleSynthActivity() {
    if (synthToggle)
        stop();
    else
        start();
    synthToggle = ! synthToggle;
}

function start() {
    Pico.play(compositeTone());
}

function stop() {
    Pico.pause();
}

document.body.onresize = function(event) {
    var canvas = document.getElementById("canvas");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawWeirdness();
};

document.body.onload = function(event) {
    document.body.onresize(null);
};

function drawWeirdness() {
    // inspired on https://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
    var canvas = document.getElementById("canvas");
    var canvasCtx = canvas.getContext("2d");
    var ctxImageData = canvasCtx.createImageData(canvas.width, canvas.height);
    var pixels  = ctxImageData.data;
    var pixelIndex = 0;
    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            params = getParamsForPosition(x, y);
            //pixels[pixelIndex] = 255 * ((params.freq1 - params.freq1_min) / (params.freq1_max - params.freq1_min));
            var harmonyFac = harmonyFactors(params);
            var color = harmonyFactorsToColor(harmonyFac);
            pixels[pixelIndex] = color[0];
            pixels[pixelIndex + 1] = color[1];
            pixels[pixelIndex + 2] = color[2];
            pixels[pixelIndex + 3] = 255;
            pixelIndex += 4;
        }
    }
    canvasCtx.putImageData(ctxImageData, 0, 0);
}

function canonicalAngle(angle) {
    // ugh...
    while (true) {
        if (angle < -Math.PI)
            angle += (2 * Math.PI);
        else if (angle > Math.PI)
            angle -= (2 * Math.PI);
        else
            break;
    }
    return angle;
}

function getParamsForPosition(x, y) {
    var relativeX = x / window.innerWidth;
    var relativeY = 1.0 - (y / window.innerHeight);
    var circleX = (relativeX - 0.5) * 2;
    var circleY = (relativeY - 0.5) * 2;
    var quadrantX = Math.abs(circleX);
    var quadrantY = Math.abs(circleY);
    var quadrant = (circleX < 0 ? (circleY < 0 ? 2 : 1) : (circleY < 0 ? 3 : 0));

    var interval1, interval2, baseColor;
    if (quadrant === 3) {
        interval1 = quadrantX * 13;
        interval2 = interval1 + (quadrantY * 13);
        baseColor = [138, 43, 226];
    }
    else {
        var scale = (quadrant === 1 ? NMAJOR_SCALE : (quadrant === 0 ? SILLY_SCALE : PSEUDOINDIAN_22_SCALE));
        var scaleIdx1 = Math.floor(quadrantX * (1 + (scale.length * 1)));
        var scaleIdx2 = Math.floor(quadrantY * (1 + scale.length));
        interval1 = scale[scaleIdx1 % scale.length] + (12 * Math.floor((scaleIdx1 / scale.length)));
        interval2 = interval1 + scale[scaleIdx2 % scale.length] + (12 * Math.floor((scaleIdx2 / scale.length)));
        baseColor = (quadrant === 1 ? [135, 206, 250] : (quadrant === 0 ? [177, 168, 225] : [238, 221, 130]));
    }

    return {
        'baseColor': baseColor,
        'quadrantX': quadrantX,
        'quadrantY': quadrantY,
        'freq1': applyIntervalToFreq(261.626, interval1),
        'freq2': applyIntervalToFreq(261.626, interval2),
        'freq1_min': 261.626,
        'freq1_max': applyIntervalToFreq(261.626, 13),
        'freq2_min': 261.626,
        'freq2_max': applyIntervalToFreq(261.626, 13 + 12)};
        //'quadrantWeights': weights};
}

function setParams(params) {
    freq1 = params.freq1;
    freq2 = params.freq2;
    //quadrantWeights = params.quadrantWeights;
}

document.onmousemove = function (event) {
    // from: https://stackoverflow.com/questions/7790725/javascript-track-mouse-position
    var dot, eventDoc, doc, body, pageX, pageY;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX === null && event.clientX !== null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
            (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    //console.log("params: " + JSON.stringify(getParamsForPosition(event.pageX, event.pageY)));
    setParams(getParamsForPosition(event.pageX, event.pageY));
    //console.log("weights: " + quadrantWeights);
};

window.onkeydown = function(event) {
    toggleSynthActivity();
};

document.onclick = function(event) {
    toggleSynthActivity();
};
