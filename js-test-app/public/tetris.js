/*
Author: Simon Laroche
Site: http://simon.lc/
Demo: http://simon.lc/tetr.js

Note: Before looking at this code, it would be wise to do a bit of reading about
the game so you know why some things are done a certain way.
*/
'use strict';

// boom.
function ObjectClone(obj) {
  var copy = (obj instanceof Array) ? [] : {};
  for (var attr in obj) {
    if (!obj.hasOwnProperty(attr)) continue;
    copy[attr] = (typeof obj[attr] == "object")?ObjectClone(obj[attr]):obj[attr];
  }
  return copy;
}
function $$(id){
  return document.getElementById(id);
}
function $setText(elm,s){
  if(typeof elm.innerText==="string"){
    elm.innerText=s;
  }else{
    elm.textContent=s;
  }
}

/**
 * Playfield.
 */
var cellSize;
var column;

/**
 * Get html elements.
 */
var msg = $$('msg');
var stats = $$('stats');
var statsTime = $$('time');
var statsLines = $$('line');
var statsPiece = $$('piece');
var statsScore = $$('score');
var statsLevel = $$('level');

var h3 = document.getElementsByTagName('h3');
var set = $$('settings');
var leaderboard = $$('leaderboard');
var replaydata = $$('replaydata');
var hidescroll = $$('hidescroll');

// Get canvases and contexts
var holdCanvas = $$('hold');
var bgStackCanvas = $$('bgStack');
var stackCanvas = $$('stack');
var activeCanvas = $$('active');
var previewCanvas = $$('preview');
var spriteCanvas = $$('sprite');

var timeCanvas = $$('time').childNodes[0];

var holdCtx = holdCanvas.getContext('2d');
var bgStackCtx = bgStackCanvas.getContext('2d');
var stackCtx = stackCanvas.getContext('2d');
var activeCtx = activeCanvas.getContext('2d');
var previewCtx = previewCanvas.getContext('2d');
var spriteCtx = spriteCanvas.getContext('2d');

var timeCtx = timeCanvas.getContext('2d');

var touchLeft = $$('touchLeft');
var touchRight = $$('touchRight');
var touchDown = $$('touchDown');
var touchDrop = $$('touchDrop');
var touchHold = $$('touchHold');
var touchRotLeft = $$('touchRotLeft');
var touchRotRight = $$('touchRotRight');
var touchRot180 = $$('touchRot180');

var touchLayout = $$('touchLayout');

var touchButtons = [
  touchLeft, touchRight, touchDown, touchDrop,
  touchHold, touchRotRight, touchRotLeft, touchRot180
];
touchLeft.bindsMemberName = "moveLeft";
touchRight.bindsMemberName = "moveRight";
touchDown.bindsMemberName = "moveDown";
touchDrop.bindsMemberName = "hardDrop";
touchHold.bindsMemberName = "holdPiece";
touchRotRight.bindsMemberName = "rotRight";
touchRotLeft.bindsMemberName = "rotLeft";
touchRot180.bindsMemberName = "rot180";

var nLayouts = 7, currLayout = -2 /* none */;

/**
 * Piece data
 */

// [r][x][y]
var TetroI = [
  [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
  [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]];
var TetroJ = [
  [[2,2,0,0],[0,2,0,0],[0,2,0,0],[0,0,0,0]],
  [[0,0,0,0],[2,2,2,0],[2,0,0,0],[0,0,0,0]],
  [[0,2,0,0],[0,2,0,0],[0,2,2,0],[0,0,0,0]],
  [[0,0,2,0],[2,2,2,0],[0,0,0,0],[0,0,0,0]]];
var TetroL = [
  [[0,3,0,0],[0,3,0,0],[3,3,0,0],[0,0,0,0]],
  [[0,0,0,0],[3,3,3,0],[0,0,3,0],[0,0,0,0]],
  [[0,3,3,0],[0,3,0,0],[0,3,0,0],[0,0,0,0]],
  [[3,0,0,0],[3,3,3,0],[0,0,0,0],[0,0,0,0]]];
var TetroO = [
  [[0,0,0,0],[4,4,0,0],[4,4,0,0],[0,0,0,0]],
  [[0,0,0,0],[4,4,0,0],[4,4,0,0],[0,0,0,0]],
  [[0,0,0,0],[4,4,0,0],[4,4,0,0],[0,0,0,0]],
  [[0,0,0,0],[4,4,0,0],[4,4,0,0],[0,0,0,0]]];
var TetroS = [
  [[0,5,0,0],[5,5,0,0],[5,0,0,0],[0,0,0,0]],
  [[0,0,0,0],[5,5,0,0],[0,5,5,0],[0,0,0,0]],
  [[0,0,5,0],[0,5,5,0],[0,5,0,0],[0,0,0,0]],
  [[5,5,0,0],[0,5,5,0],[0,0,0,0],[0,0,0,0]]];
var TetroT = [
  [[0,6,0,0],[6,6,0,0],[0,6,0,0],[0,0,0,0]],
  [[0,0,0,0],[6,6,6,0],[0,6,0,0],[0,0,0,0]],
  [[0,6,0,0],[0,6,6,0],[0,6,0,0],[0,0,0,0]],
  [[0,6,0,0],[6,6,6,0],[0,0,0,0],[0,0,0,0]]];
var TetroZ = [
  [[7,0,0,0],[7,7,0,0],[0,7,0,0],[0,0,0,0]],
  [[0,0,0,0],[0,7,7,0],[7,7,0,0],[0,0,0,0]],
  [[0,7,0,0],[0,7,7,0],[0,0,7,0],[0,0,0,0]],
  [[0,7,7,0],[7,7,0,0],[0,0,0,0],[0,0,0,0]]];
// [r][MINX MINY MAXX MAXY]
var RectI = [[0,1,4,2],[2,0,3,4],[0,2,4,3],[1,0,2,4]];
var RectJ = [[0,0,3,2],[1,0,3,3],[0,1,3,3],[0,0,2,3]];
var RectL = [[0,0,3,2],[1,0,3,3],[0,1,3,3],[0,0,2,3]];
var RectO = [[1,0,3,2],[1,0,3,2],[1,0,3,2],[1,0,3,2]];
var RectS = [[0,0,3,2],[1,0,3,3],[0,1,3,3],[0,0,2,3]];
var RectT = [[0,0,3,2],[1,0,3,3],[0,1,3,3],[0,0,2,3]];
var RectZ = [[0,0,3,2],[1,0,3,3],[0,1,3,3],[0,0,2,3]];

var WKTableSRSI_R = [
  [[ 0, 0],[-2, 0],[+1, 0],[-2,+1],[+1,-2]],
  [[ 0, 0],[-1, 0],[+2, 0],[-1,-2],[+2,+1]],
  [[ 0, 0],[+2, 0],[-1, 0],[+2,-1],[-1,+2]],
  [[ 0, 0],[+1, 0],[-2, 0],[+1,+2],[-2,-1]]];
var WKTableSRSI_L = [
  [[ 0, 0],[-1, 0],[+2, 0],[-1,-2],[+2,+1]],
  [[ 0, 0],[+2, 0],[-1, 0],[+2,-1],[-1,+2]],
  [[ 0, 0],[+1, 0],[-2, 0],[+1,+2],[-2,-1]],
  [[ 0, 0],[-2, 0],[+1, 0],[-2,+1],[+1,-2]]];
var WKTableSRSI_2 = [
  [[ 0, 0],[-1, 0],[-2, 0],[+1, 0],[+2, 0],[ 0,+1]],
  [[ 0, 0],[ 0,+1],[ 0,+2],[ 0,-1],[ 0,-2],[-1, 0]],
  [[ 0, 0],[+1, 0],[+2, 0],[-1, 0],[-2, 0],[ 0,-1]],
  [[ 0, 0],[ 0,+1],[ 0,+2],[ 0,-1],[ 0,-2],[+1, 0]]];
var WKTableSRSX_R = [
  [[ 0, 0],[-1, 0],[-1,-1],[ 0,+2],[-1,+2]],
  [[ 0, 0],[+1, 0],[+1,+1],[ 0,-2],[+1,-2]],
  [[ 0, 0],[+1, 0],[+1,-1],[ 0,+2],[+1,+2]],
  [[ 0, 0],[-1, 0],[-1,+1],[ 0,-2],[-1,-2]]];
var WKTableSRSX_L = [
  [[ 0, 0],[+1, 0],[+1,-1],[ 0,+2],[+1,+2]],
  [[ 0, 0],[+1, 0],[+1,+1],[ 0,-2],[+1,-2]],
  [[ 0, 0],[-1, 0],[-1,-1],[ 0,+2],[-1,+2]],
  [[ 0, 0],[-1, 0],[-1,+1],[ 0,-2],[-1,-2]]];
var WKTableSRSX_2 = [
  [[ 0, 0],[+1, 0],[+2, 0],[+1,+1],[+2,+1],[-1, 0],[-2, 0],[-1,+1],[-2,+1],[ 0,-1],[+3, 0],[-3, 0]],
  [[ 0, 0],[ 0,+1],[ 0,+2],[-1,+1],[-1,+2],[ 0,-1],[ 0,-2],[-1,-1],[-1,-2],[+1, 0],[ 0,+3],[ 0,-3]],
  [[ 0, 0],[-1, 0],[-2, 0],[-1,-1],[-2,-1],[+1, 0],[+2, 0],[+1,-1],[+2,-1],[ 0,+1],[-3, 0],[+3, 0]],
  [[ 0, 0],[ 0,+1],[ 0,+2],[+1,+1],[+1,+2],[ 0,-1],[ 0,-2],[+1,-1],[+1,-2],[-1, 0],[ 0,+3],[ 0,-3]]];
var WKTableSRSI = [WKTableSRSI_R,WKTableSRSI_L,WKTableSRSI_2];
var WKTableSRSX = [WKTableSRSX_R,WKTableSRSX_L,WKTableSRSX_2];
var WKTableSRS = [WKTableSRSI,WKTableSRSX,WKTableSRSX,WKTableSRSX,WKTableSRSX,WKTableSRSX,WKTableSRSX];

var WKTableCultris = [[ 0, 0],[-1, 0],[+1, 0],[ 0,+1],[-1,+1],[+1,+1],[-2, 0],[+2, 0],[ 0,-1]];

var WKTableDTET_R = [[ 0, 0],[+1, 0],[-1, 0],[ 0,+1],[+1,+1],[-1,+1],[ 0,-1]];
var WKTableDTET_L = [[ 0, 0],[-1, 0],[+1, 0],[ 0,+1],[-1,+1],[+1,+1],[ 0,-1]];
var WKTableDTET = [WKTableDTET_R,WKTableDTET_L,WKTableDTET_L];

var WKTableDX_R = [[[0, 0], [-1, -1]], [[0, 0], [+1, -1]], [[0, 0], [+1, +1]], [[0, 0], [-1, +1]]];
var WKTableDX_L = [[[0, 0], [+1, -1]], [[0, 0], [+1, +1]], [[0, 0], [-1, +1]], [[0, 0], [-1, -1]]];
var WKTableDX_2 = [[[0, 0], [ 0, -2]], [[0, 0], [-2,  0]], [[0, 0], [ 0, +2]], [[0, 0], [+2,  0]]];
var WKTableDX = [WKTableDX_R,WKTableDX_L,WKTableDX_2];

var OffsetSRS = [
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]]];
var OffsetARS = [
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[-1, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[+1, 0]]];
var OffsetDTET = [
  [[ 0,+1],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+2],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[ 0,+2],[ 0,+2],[ 0,+2]],
  [[ 0,+2],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[ 0,+1],[ 0,+1],[ 0,+1]]];
var OffsetQQ = [
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]]];
var OffsetAtari = [
  [[ 0,-1],[-1, 0],[ 0,-2],[ 0, 0]],
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[-1, 0],[-1, 0],[-1, 0],[-1, 0]],
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]]];
var OffsetNBlox = [
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0, 0],[ 0, 0],[+1, 0]]];
var OffsetNintendo = [
  [[ 0,+1],[ 0, 0],[ 0, 0],[+1, 0]],
  [[+1,+1],[+1,+1],[+1,+1],[+1,+1]],
  [[+1,+1],[+1,+1],[+1,+1],[+1,+1]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[+1,+2],[+1,+1],[+1,+1],[+2,+1]],
  [[+1,+1],[+1,+1],[+1,+1],[+1,+1]],
  [[+1,+2],[+1,+1],[+1,+1],[+2,+1]]];
var OffsetMS = [
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[+1,+1],[ 0,+1],[+1, 0],[+1,+1]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1,+1],[ 0,+1],[+1, 0],[+1,+1]]];
var OffsetE60 = [
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[+1,+1],[+1, 0],[+1, 0],[+2, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1,+1],[+1, 0],[+1, 0],[+2, 0]]];
var OffsetJJSRS = [
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]],
  [[+1, 0],[+1, 0],[+1, 0],[+1, 0]]];
var Offset5000 = [
  [[ 0,+1],[-1, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[ 0,+1],[-1, 0],[ 0,-1],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]]];
var OffsetPlus = [
  [[ 0, 0],[ 0, 0],[ 0,-1],[+1, 0]],
  [[+1,+1],[+1, 0],[+1, 0],[+1, 0]],
  [[+1,+1],[+1, 0],[+1, 0],[+1, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[+1,+1],[ 0, 0],[+1, 0],[+1, 0]],
  [[+1,+1],[+1, 0],[+1, 0],[+1, 0]],
  [[+1,+1],[+1, 0],[+1, 0],[+2, 0]]];
var OffsetDX = [
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]]];
var OffsetNintendoL = [
  [[ 0,+1],[-1, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[-1,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+2],[-1,+1],[ 0,+1],[ 0,+1]]];
var OffsetQuadra = [
  [[ 0, 0],[-1, 0],[ 0,-1],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[ 0,+1],[ 0,+1],[ 0,+1]],
  [[ 0,+1],[-1, 0],[ 0, 0],[ 0, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[ 0,+1],[-1, 0],[ 0, 0],[ 0, 0]]];
var OffsetMybo = [
  [[ 0,+2],[-1, 0],[ 0,+1],[ 0, 0]],
  [[+1,+2],[ 0,+1],[+1,+1],[+1,+1]],
  [[+1,+2],[ 0,+1],[+1,+1],[+1,+1]],
  [[ 0,+2],[ 0,+2],[ 0,+2],[ 0,+2]],
  [[+1,+2],[+1,+1],[+1,+1],[+2,+1]],
  [[+1,+2],[+1,+1],[+1,+1],[+1,+1]],
  [[+1,+2],[+1,+1],[+1,+1],[+2,+1]]];
var OffsetTNET = [
  [[ 0,-1],[ 0, 0],[ 0,-2],[+1, 0]],
  [[+1, 0],[ 0, 0],[+1,-1],[+1, 0]],
  [[+1, 0],[ 0, 0],[+1,-1],[+1, 0]],
  [[ 0, 0],[ 0, 0],[ 0, 0],[ 0, 0]],
  [[+1, 0],[ 0, 0],[+1,-1],[+1, 0]],
  [[+1, 0],[ 0, 0],[+1,-1],[+1, 0]],
  [[+1, 0],[ 0, 0],[+1,-1],[+1, 0]]];

//x, y, r
var InitInfoSRS = [[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 0]];
var InitInfoARS = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoDTET = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoQQ = [[ 0, 0, 0],[ 0, 0, 1],[ 0, 0, 3],[ 0, 0, 0],[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 0]];
var InitInfoAtari = [[+1, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoNBlox = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoNintendo = [[ 0, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoMS = [[ 0, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoE60 = [[ 0, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoJJSRS = [[ 0, 0, 0],[+1, 0, 0],[+1, 0, 0],[ 0, 0, 0],[+1, 0, 0],[+1, 0, 0],[+1, 0, 0]];
var InitInfo5000 = [[ 0, 0, 3],[ 0, 0, 1],[+1, 0, 3],[ 0, 0, 0],[ 0, 0, 0],[ 0, -1, 2],[ 0, 0, 0]];
var InitInfoPlus = [[ 0, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoDX = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoNintendoL = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoQuadra = [[ 0, 0, 0],[ 0, 0, 2],[ 0, 0, 2],[ 0,+1, 0],[ 0,+1, 0],[ 0, 0, 2],[ 0,+1, 0]];
var InitInfoMybo = [[ 0,+1, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];
var InitInfoTNET = [[ 0, 0, 0],[+1, 0, 2],[+1, 0, 2],[ 0,+1, 0],[+1,+1, 0],[+1, 0, 2],[+1,+1, 0]];

var ColorSRS = [1, 2, 3, 4, 5, 6, 7];
var ColorSega = [7, 2, 3, 4, 6, 1, 5];
var ColorQQ = [7, 1, 3, 4, 5, 6, 2];
var ColorTengen = [7, 3, 6, 2, 5, 4, 1];
var ColorAtari = [7, 4, 6, 2, 1, 5, 3];
var ColorNBlox = [3, 6, 2, 7, 1, 4, 5];
var ColorC2 = [5, 2, 6, 4, 1, 7, 9];
var ColorNintendo = [9, 2, 7, 9, 2, 9, 7];
var ColorMS = [7, 6, 4, 1, 2, 8, 5];
var ColorE60 = [5, 5, 5, 5, 5, 5, 5];
var ColorIBM = [7, 9, 6, 2, 5, 3, 1];
var ColorJJSRS = [5, 1, 3, 4, 7, 6, 2];
var Color5000 = [7, 6, 8, 4, 5, 1, 2];
var ColorDX = [9, 7, 2, 4, 3, 5, 6];
var ColorMybo = [5, 6, 7, 4, 3, 2, 1];
var ColorQuadra = [5, 4, 6, 3, 1, 2, 7];
var ColorGameBoy = [9, 2, 7, 8, 7, 9, 2];
var ColorTNET = [5, 5, 6, 4, 2, 4, 7];

var RotSys = [
  {
    initinfo: InitInfoSRS,
    offset: OffsetSRS,
    color: ColorSRS,
  },
  {
    initinfo: InitInfoSRS,
    offset: OffsetSRS,
    color: ColorC2,
  },
  {
    initinfo: InitInfoARS,
    offset: OffsetARS,
    color: ColorSega,
  },
  {
    initinfo: InitInfoDTET,
    offset: OffsetDTET,
    color: ColorSega,
  },
  {
    initinfo: InitInfoQQ,
    offset: OffsetQQ,
    color: ColorQQ,
  },
  {
    initinfo: InitInfoAtari,
    offset: OffsetAtari,
    color: ColorAtari,
  },
  {
    initinfo: InitInfoAtari,
    offset: OffsetAtari,
    color: ColorTengen,
  },
  {
    initinfo: InitInfoNBlox,
    offset: OffsetNBlox,
    color: ColorNBlox,
  },
  {
    initinfo: InitInfoNintendo,
    offset: OffsetNintendo,
    color: ColorNintendo,
  },
  {
    initinfo: InitInfoMS,
    offset: OffsetMS,
    color: ColorMS,
  },
  {
    initinfo: InitInfoE60,
    offset: OffsetE60,
    color: ColorE60,
  },
  {
    initinfo: InitInfoE60,
    offset: OffsetE60,
    color: ColorIBM,
  },
  {
    initinfo: InitInfoJJSRS,
    offset: OffsetJJSRS,
    color: ColorJJSRS,
  },
  {
    initinfo: InitInfo5000,
    offset: Offset5000,
    color: Color5000,
  },
  {
    initinfo: InitInfoPlus,
    offset: OffsetPlus,
    color: ColorSega,
  },
  {
    initinfo: InitInfoDX,
    offset: OffsetDX,
    color: ColorDX,
  },
  {
    initinfo: InitInfoNintendoL,
    offset: OffsetNintendoL,
    color: ColorGameBoy,
  },
  {
    initinfo: InitInfoQuadra,
    offset: OffsetQuadra,
    color: ColorQuadra,
  },
  {
    initinfo: InitInfoMybo,
    offset: OffsetMybo,
    color: ColorMybo,
  },
  {
    initinfo: InitInfoTNET,
    offset: OffsetTNET,
    color: ColorTNET,
  },
];

// Define shapes and spawns.
var PieceI = {
  index: 0,
  tetro: TetroI,
  rect: RectI
};
var PieceJ = {
  index: 1,
  tetro: TetroJ,
  rect: RectJ
};
var PieceL = {
  index: 2,
  tetro: TetroL,
  rect: RectL
};
var PieceO = {
  index: 3,
  tetro: TetroO,
  rect: RectO
};
var PieceS = {
  index: 4,
  tetro: TetroS,
  rect: RectS
};
var PieceT = {
  index: 5,
  tetro: TetroT,
  rect: RectT
};
var PieceZ = {
  index: 6,
  tetro: TetroZ,
  rect: RectZ
};

var pieces = [PieceI, PieceJ, PieceL, PieceO, PieceS, PieceT, PieceZ];

// Finesse data
// index x orientatio x column = finesse
// finesse[0][0][4] = 1
// TODO double check these.
var finesse = [
  [
    [1, 2, 1, 0, 1, 2, 1],
    [2, 2, 2, 2, 1, 1, 2, 2, 2, 2],
    [1, 2, 1, 0, 1, 2, 1],
    [2, 2, 2, 2, 1, 1, 2, 2, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2],
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2],
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2]
  ]
];

/**
 * Gameplay specific vars.
 */
var gravityUnit = 1.0/64;
var gravity;

var gravityArr = (function() {
  var array = [];
  array.push(0);
  for (var i = 1; i < 64; i++) array.push(i / 64);
  for (var i = 1; i <= 20; i++) array.push(i);
  return array;
})();

var lockDelayLimit = void 0;

var mySettings = {
  DAS: 9,
  ARR: 1,
  Gravity: 0,
  'Soft Drop': 6,
  'Lock Delay': 30,
  RotSys: 0,
  Next: 6,
  Size: 2,
  Sound: 0,
  Volume: 50,
  Block: 2,
  Ghost: 0,
  Grid: 0,
  Outline: 1,
  DASCut: 0,
  NextSide: 0
};

var settings = mySettings; // initialized by reference; replaced when game starts and replay

var settingName = {
  DAS: "DAS",
  ARR: "ARR",
  Gravity: "Gravity",
  'Soft Drop': "Soft Drop",
  'Lock Delay': "Lock Delay",
  RotSys: "Rotation",
  Next: "Next",
  Size: "Size",
  Sound: "On",
  Volume: "Volume",
  Block: "Block",
  Ghost: "Ghost",
  Grid: "Grid",
  Outline: "Outline",
  DASCut: "DAS Cut",
  NextSide: "Next Side"
};
var setting = {
  DAS: range(0,31),
  ARR: range(0,11),
  Gravity: (function() {
    var array = [];
    array.push('Auto');
    array.push('0G');
    for (var i = 1; i < 64; i*=2)
      array.push('1/'+(64/i)+'G');
    for (var i = 1; i <= 20; i+=19)
      array.push(i + 'G');
    return array;
  })(),
  'Soft Drop': (function() {
    var array = [];
    for (var i = 1; i < 64; i*=2)
      array.push('1/'+(64/i)+'G');
    for (var i = 1; i <= 20; i+=19)
      array.push(i + 'G');
    return array;
  })(),
  'Lock Delay': range(0, 101),
  RotSys: ['Super', 'C2', 'Arika*', 'DTET', 'QQ', 'Atari', 'Tengen', 'N-Blox', 'Nintendo', 'MS', 'E-60', 'IBM PC', 'JJ', '5000', 'Plus', 'DX', 'GameBoy', 'Quadra', 'Mybo', 'TNET'],
  Next: ['-', '1', '2', '3', '4', '5', '6'],
  Size: ['Auto', 'Small', 'Medium', 'Large', 'Larger'],
  Sound: ['Off', 'On'],
  Volume: range(0, 101),
  Block: ['Shaded', 'Solid', 'Glossy', 'Arika', 'World'],
  Ghost: ['Normal', 'Colored', 'Off', 'Hidden'],
  Grid: ['Off', 'On'],
  Outline: ['Off', 'On', 'Hidden', 'Only'],
  DASCut: ['Off', 'On'],
  NextSide: ['Right', 'Left']
};
var arrRowGen = {
  'simple':
  function(arr,offset,range,width) {
    var holex = ~~(rng.next()*range)+offset;
    for(var x = 0; x < width; x++){
      arr[holex + x] = 0;
    }
  },
  'simplemessy':
  function(arr,ratio) {
    var hashole = false;
    for(var x = 0; x < stack.width; x++){
      if(rng.next()>=ratio) {
        hashole=true;
        arr[x] = 0;
      }
    }
    if(hashole===false){
      arr[~~(rng.next()*10)] = 0;
    }
  },
};

var arrStages = [
  {begin:   0, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
  {begin:   5, delay: 60*7, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
  {begin:  20, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
  {begin:  40, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,2,3,4)}},
  {begin:  50, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
  {begin:  70, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:  80, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:  90, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},

  {begin: 100, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin: 120, delay: 60*3.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin: 150, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
  {begin: 170, delay: 60*3.5, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},

  {begin: 200, delay: 60*3.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin: 220, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin: 250, delay: 60*2.5, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},

  {begin: 300, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
  {begin: 320, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
  {begin: 350, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
  {begin: 390, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
  {begin: 400, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
  {begin: 430, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
  {begin: 450, delay: 60*7, gen:function(arr){arrRowGen.simplemessy(arr,0.1)}},

  {begin: 470, delay: 60*7, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
  {begin: 500, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
  {begin: 550, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
  {begin: 600, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
  {begin: 650, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
  {begin: 700, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
  {begin: 750, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
  {begin: 780, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
  {begin: 800, delay: 60*2, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
  {begin: 900, delay: 60*1.75, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin: 950, delay: 60*1.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},

  {begin:1000, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
  {begin:1020, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
  {begin:1050, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,1,1,8)}},
  {begin:1100, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,2,1,6)}},
  {begin:1150, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,3,1,4)}},
  {begin:1200, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
  {begin:1210, delay: 60*1.5, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
  {begin:1210, delay: 60*1, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
  {begin:1250, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,9,1,1)}},
  {begin:1260, delay: 60*0.5, gen:function(arr){arrRowGen.simple(arr,9,1,1)}},
  {begin:1300, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
  {begin:1350, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.1)}},
  {begin:1400, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.15)}},
  {begin:1450, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.2)}},
  {begin:1480, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.2)}},

  {begin:1500, delay: 60*1.5, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:1550, delay: 60*1.4, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:1600, delay: 60*1.3, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:1650, delay: 60*1.2, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
  {begin:1700, delay: 60*1.3, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:1800, delay: 60*1.2, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:1850, delay: 60*1.15, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:1900, delay: 60*1.1, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:1950, delay: 60*1.05, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},

  {begin:2000, delay: 60*1.0, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2050, delay: 60*0.95, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2100, delay: 60*0.9, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2150, delay: 60*0.85, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2180, delay: 60*0.8, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2190, delay: 60*1.0, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2200, delay: 60*0.8, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2300, delay: 60*0.75, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2400, delay: 60*0.7, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2450, delay: 60*0.6, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
  {begin:2500, delay: 60*0.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},

];

var sprintRanks= [
  {t:600, b:"Zen"},
  {t:540, b:"9 min...?"},
  {t:480, b:"8 min...?"},
  {t:420, b:"7 min...?"},
  {t:360, b:"6 min...?"},
  {t:300, b:"5 min...?"},
  {t:240, b:"Finally..."},
  {t:210, b:"Too slow."},
  {t:180, b:"Well..."},
  {t:160, b:"Gotta go fast."},
  {t:140, b:"Any more?"},
  {t:120, b:"Beat 2 min."},
  {t:110, b:"So easy."},
  {t:100, b:"New world."},
  {t: 90, b:"1 drop/sec!"},
  {t: 80, b:"Not bad."},
  {t: 73, b:"Going deeper."},
  {t: 69, b:"10 sec faster."},
  {t: 63, b:"Approaching."},
  {t: 60, b:"Almost there!"},
  {t: 56, b:"1-min Sprinter!"},
  {t: 53, b:"<small>No longer rookie.</small>"},
  {t: 50, b:"Beat 50."},
  {t: 48, b:"2 drops/sec!"},
  {t: 45, b:"u can tetris."},
  {t: 42, b:"Interesting."},
  {t: 40, b:"So?"},
  {t: 38, b:"Good."},
  {t: 35, b:"Unstoppable."},
  {t: 33, b:"Octopus"},
  {t: 31, b:"3 drops/sec!"},
  {t: 30, b:"Noooo"},
  {t: 29, b:"You win."},
  {t: 27, b:"Magic."},
  {t: 25, b:"Lightning!"},
  {t: 24, b:"4 drops/sec!"},
  {t: 23, b:"Alien."},
  {t: 22, b:"Beats Alien."},
  {t: 21, b:"<small>Save the world?</small>"},
  {t: 20, b:"r u sure?"},
  {t: 19, b:"5pps"},
  {t: 18, b:"..."},
  {t: 16.66, b:"......"},
  {t: 14.28, b:"6pps"},
  {t: 12.50, b:"7pps"},
  {t: 11.11, b:"8pps"},
  {t: 10.00, b:"9pps"},
  {t:  9.00, b:"10pps"},
  {t:  0.00, b:"→_→"},
  {t:  -1/0, b:"↓_↓"}
];

var frame;
var frameSkipped;

/**
* for dig challenge mode
*/

var frameLastRise;
var frameLastHarddropDown;

/**
* for dig zen mode
*/

var digZenBuffer;
var lastPiecesSet;

/**
* Pausing variables
*/

var startPauseTime;
var pauseTime;

/**
 * 0 = Normal
 * 1 = win
 * 2 = countdown
 * 3 = game not played
 * 9 = loss
 */
var gameState = 3;

var paused = false;
var lineLimit;

var replay;
var watchingReplay = false;
var toGreyRow;
var gametype;
var gameparams;
//TODO Make dirty flags for each canvas, draw them all at once during frame call.
// var dirtyHold, dirtyActive, dirtyStack, dirtyPreview;
var lastX, lastY, lastPos, lastLockDelay, landed;

// Scoreing related status
var b2b;
var combo;
var level;
var allclear;

// Stats
var lines;
var score;
var statsFinesse;
var piecesSet;
var startTime;
var scoreTime;
var scoreStartTime;
var digLines = [];

// Keys
var keysDown;
var lastKeys;
var released;

var binds = {
  pause: 27,
  moveLeft: 37,
  moveRight: 39,
  moveLeft3: 0,
  moveRight3: 0,
  moveDown: 40,
  hardDrop: 32,
  holdPiece: 67,
  rotRight: 88,
  rotLeft: 90,
  rot180: 16,
  retry: 82
};
var flags = {
  hardDrop: 1,
  moveRight: 2,
  moveLeft: 4,
  moveDown: 8,
  holdPiece: 16,
  rotRight: 32,
  rotLeft: 64,
  rot180: 128,
  moveRight3: 256,
  moveLeft3: 512,
};

function resize() {
  var a = $$('a');
  var b = $$('b');
  var c = $$('c');
  var d = $$('d');
  var content = $$('content');

  if (settings.NextSide === 1) {
    content.innerHTML = "";
    content.appendChild(c);
    content.appendChild(b);
    content.appendChild(d);
  } else {
    content.innerHTML = "";
    content.appendChild(d);
    content.appendChild(b);
    content.appendChild(c);
  }

  // TODO Finalize this.
  // Aspect ratio: 1.024
  var padH = 12;
  var screenHeight = window.innerHeight - padH * 2;
  var screenWidth = ~~(screenHeight * 1.0);
  if (screenWidth > window.innerWidth)
    screenHeight = ~~(window.innerWidth / 1.0);

  cellSize = Math.max(~~(screenHeight / 20), 10);
  if (settings.Size === 1 && cellSize >= 16) cellSize = 16;
  else if (settings.Size === 2 && cellSize >= 24) cellSize = 24;
  else if (settings.Size === 3 && cellSize >= 32) cellSize = 32;
  else if (settings.Size === 4 && cellSize >= 48) cellSize = 48;

  var pad = (window.innerHeight - (cellSize * 20 + 2));
  var padFinal = Math.min(pad/2, padH);
  //console.log(pad);
  content.style.padding =
    //"0 0";
    //(pad / 2) + 'px' + ' 0';
    (padFinal) + 'px' + ' 0';

  stats.style.bottom =
    //(pad) + 'px';
    //(pad / 2) + 'px';
    (pad - padFinal) + 'px';
    //(pad - padH) + 'px';

  // Size elements
  a.style.padding = '0 0.5rem ' + ~~(cellSize / 2) + 'px';

  stackCanvas.width = activeCanvas.width = bgStackCanvas.width = cellSize * 10;
  stackCanvas.height = activeCanvas.height = bgStackCanvas.height = cellSize * 20;
  b.style.width = stackCanvas.width + 'px';
  b.style.height = stackCanvas.height + 'px';

  holdCanvas.width = cellSize * 4;
  holdCanvas.height = cellSize * 3;
  a.style.width = holdCanvas.width + 'px';
  a.style.height = holdCanvas.height + 'px';

  previewCanvas.width = cellSize * 4;
  previewCanvas.height = stackCanvas.height - cellSize * 2;
  c.style.width = previewCanvas.width + 'px';
  c.style.height = b.style.height;

  // Scale the text so it fits in the thing.
  // TODO get rid of extra font sizes here.
  msgdiv.style.lineHeight = b.style.height;
  msg.style.fontSize = ~~(stackCanvas.width / 6) + 'px';
  msg.style.lineHeight = msg.style.fontSize;
  stats.style.fontSize = ~~(stackCanvas.width / 11) + 'px';
  document.documentElement.style.fontSize = ~~(stackCanvas.width / 16) + 'px';

  for (var i = 0, len = h3.length; i < len; i++) {
    h3[i].style.lineHeight = (cellSize * 2) + 'px';
    h3[i].style.fontSize = stats.style.fontSize;
  }
  stats.style.width = d.clientWidth + 'px';

  timeCanvas.width = d.clientWidth;
  timeCanvas.height = timeCanvas.clientHeight || timeCanvas.offsetHeight || timeCanvas.getBoundingClientRect().height;
  timeCtx.fillStyle = "#fff";
  timeCtx.font = 'bold 1.125em Roboto, "Trebuchet MS"';
  timeCtx.textAlign = "center";
  timeCtx.textBaseline = "middle";

  touchButtonsLayout();

  // Redraw graphics
  makeSprite();

  if (settings.Grid === 1)
    bg(bgStackCtx);

  //if (gameState === 0) {
  try {
    piece.draw();
    stack.draw();
    preview.draw();
    if (hold.piece !== void 0) {
      hold.draw();
    }
    statistics();
    statisticsStack();
  } catch(e) {
  }
  //}
}
addEventListener('resize', resize, false);
addEventListener('load', resize, false);

/**
 * ========================== Model ===========================================
 */

/**
 * Resets all the settings and starts the game.
 */
function init(gt, params) {
  if (gt === 'replay') {
    watchingReplay = true;
    if(params !== void 0) {
      try {
        if(typeof params !== "string")
          throw "wtf";
        if(params === "" || params.slice(0,1) !=="{")
          throw "please paste replay data, correctly..."
        replay = JSON.parse(params.replace(/\n/g,""));
        if(typeof replay !== "object")
          throw "json parse fail";
        if((replay.gametype === void 0)
          || (replay.keys === void 0)
          || (replay.settings === void 0)
          || (replay.seed === void 0)
        ) {
          throw "something's missing...";
        }
        replay.keys = keysDecode(replay.keys);
        if(replay.keys === null)
          throw "keys decode fail"
      } catch(e) {
        alert("invalid replay data...\n" + e.toString());
        return;
      }
    }
    gametype = replay.gametype;
    gameparams = replay.gameparams || {};
    settings = replay.settings; // by reference
    rng.seed = replay.seed;
  } else {
    watchingReplay = false;
    settings = ObjectClone(mySettings); // by value: prevent from being modified when paused
    gametype = gt;
    gameparams = params || {};

    var seed = ~~(Math.random() * 2147483645) + 1;
    rng.seed = seed;

    replay = {};
    replay.keys = {};
    // TODO Make new seed and rng method.
    replay.seed = seed;
    replay.gametype = gametype;
    replay.gameparams = gameparams;
    replay.settings = settings;
  }

  if(gametype === void 0) //sometimes happens.....
    gametype = 0;

  if(gametype === 0) // sprint
    lineLimit = gameparams.lineLimit || 40;
  else if(gametype === 5) // score attack
    lineLimit = 200;
  else
    lineLimit = 0;

  //html5 mobile device sound
  if(settings.Sound === 1)
    sound.init();

  //Reset
  column = 0;
  keysDown = 0;
  lastKeys = 0;
  released = 255;
  //TODO Check if needed.
  piece = new Piece();

  frame = 0;
  frameSkipped = 0;
  lastPos = 'reset';
  stack.new(10, 20, 4);
  toGreyRow = stack.height - 1;
  hold.piece = void 0;
  if (settings.Gravity === 0) gravity = gravityUnit;

  preview.init()
  //preview.draw();

  b2b = 0;
  combo = 0;
  level = 0;
  allclear = 0;
  statsFinesse = 0;
  lines = 0;
  score = bigInt(0);
  piecesSet = 0;

  clear(stackCtx);
  clear(activeCtx);
  clear(holdCtx);

  digLines = [];
  if (gametype === 3) {
    frameLastRise = 0;
    frameLastHarddropDown = 0;
  }
  if (gametype === 4) {
    // Dig Race
    // make ten random numbers, make sure next isn't the same as last? t=rnd()*(size-1);t>=arr[i-1]?t++:; /* farter */
    //TODO make into function or own file.
    if (gameparams.digraceType === void 0 || gameparams.digraceType === "checker") {
      // harder digrace: checkerboard
      digLines = range(stack.height - 10, stack.height);
      $setText(statsLines,10);
      for (var y = stack.height - 1; y > stack.height - 10 - 1; y--) {
        for (var x = 0; x < stack.width; x++) {
          if ((x+y)&1)
            stack.grid[x][y] = 8;
        }
      }
    } else if(gameparams.digraceType === "easy") {
      var begin = ~~(rng.next()*stack.width);
      var dire = (~~(rng.next()*2))*2-1;
      digLines = range(stack.height - 10, stack.height);
      $setText(statsLines,10);
      for (var y = stack.height - 1; y > stack.height - 10 - 1; y--) {
        for (var x = 0; x < stack.width; x++) {
          if ((begin+dire*y+x+stack.width*2)%10 !== 0)
            stack.grid[x][y] = 8;
        }
      }
    }
    //stack.draw(); //resize
  }
  if (gametype === 7){
    lastPiecesSet = 0;
    digZenBuffer = 0;
  }
  if (gametype === 1 && gameparams.marathonType === 1){
    if (settings.ARR < 1){
      settings.ARR = 1;
    }
    if (settings["Soft Drop"] > 6){
      settings["Soft Drop"] = 6;
    }
    if (settings.Next > 1){
      settings.Next = 1;
    }
  }
  if (gametype === 0){
    // don't care about digLines since it's not dig mode
    if (gameparams.lineLimit === 1){
      for (var y = stack.height - 1; y > stack.height - 10 - 1; y--) {
        stack.grid[~~(rng.next()*stack.width)][y] = 8;
      }
    } else if(gameparams.lineLimit === 25){
      for (var y = stack.height - 1; y > stack.height - 10 - 1; y--) {
        var pattern = ~~(rng.next() * 1022) + 1;
        for (var x = 0; x < stack.width; x++) {
          if ((1<<x)&pattern)
            stack.grid[x][y] = ~~(rng.next() * 8) + 1;
        }
      }
    }
  }

  menu();

  // Only start a loop if one is not running already.
  // don't keep looping when not played
  // in the 0~16ms after the last frame, inloop==true and gameState==3
  // retry is instant event, so double RAF here...
  console.log(paused,gameState,inloop);
  if (/*paused || gameState === 3*/ !inloop) {
    console.log("start inloop",inloop);
    inloop=true;
    requestAnimFrame(gameLoop);
  }
  startTime = Date.now();
  startPauseTime = 0;
  pauseTime = 0;
  scoreTime = 0;
  paused = false;
  gameState = 2;

  resize();
}

function range(start, end, inc) {
  inc = inc || 1;
  var array = [];
  for (var i = start; i < end; i += inc) {
    array.push(i);
  }
  return array;
}

/**
 * Add divisor method so we can do clock arithmetics. This is later used to
 *  determine tetromino orientation.
 */
Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

/**
 * Shim.
 */
window.requestAnimFrame = (function () {
  return window.requestAnimationFrame       ||
         window.mozRequestAnimationFrame    ||
         window.webkitRequestAnimationFrame ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

function pause() {
  if (gameState === 0 || gameState === 4) {
    paused = true;
    startPauseTime = Date.now();
    $setText(msg,"Paused");
    menu(4);
  }
}

function unpause() {
  paused = false;
  pauseTime += (Date.now() - startPauseTime);
  $setText(msg,'');
  menu();
  console.log("start inloop", inloop);
  inloop = true;
  requestAnimFrame(gameLoop);
}

/**
 * Park Miller "Minimal Standard" PRNG.
 */
//TODO put random seed method in here.
var rng = new (function() {
  this.seed = 1;
  this.next = function() {
    // Returns a float between 0.0, and 1.0
    return (this.gen() / 2147483647);
  }
  this.gen = function() {
    return this.seed = (this.seed * 16807) % 2147483647;
  }
})();

function scorestring(s, n){
  var strsplit = s.split("");
  var spacetoggle = 0;
  for (var i = strsplit.length - 1 - 3; i >= 0; i -= 3) {
    strsplit[i] += (spacetoggle === n-1 ?" ":"\xA0");
    spacetoggle = (spacetoggle + 1) % n;
  }
  return strsplit.join("");
}

function updateScoreTime(){
  scoreTime = Date.now() - scoreStartTime - pauseTime;
}

/**
 * Draws the stats next to the tetrion.
 */
function statistics() {

  var time = scoreTime || 0;
  var seconds = ((time % 60000) / 1000).toFixed(2);
  var minutes = ~~(time / 60000);
  var displayTime =
    (minutes < 10 ? '0' : '') + minutes +
    (seconds < 10 ? ':0' : ':') + seconds;
  var fsbl = 30; /* frameskip bar length */
  var pos = frameSkipped % (fsbl*2);
  if (frameSkipped < 0 && pos !== 0) {
    pos = 60 + pos; // euclid division modulus
  }
  var skipL = pos, skipR = pos;
  skipL = (skipL-fsbl<0)?0:(skipL-fsbl);
  skipR = (skipR>fsbl)?fsbl:skipR;
  skipL = skipL/fsbl*timeCanvas.width;
  skipR = skipR/fsbl*timeCanvas.width;

  timeCtx.clearRect(0, 0, timeCanvas.width, timeCanvas.height);
  timeCtx.fillText(displayTime, timeCanvas.width/2, timeCanvas.height/2);
  timeCtx.fillRect(skipL,timeCanvas.height-0.4,skipR,timeCanvas.height);
}

/**
 * Draws the stats about the stack next to the tetrion.
 */
// /* farter */
function statisticsStack() {
  $setText(statsPiece, piecesSet);

  if(gametype === 0 || gametype === 5) {
    $setText(statsLines, lineLimit - lines);
    $setText(statsLevel, "");
  }else if(gametype === 1 || gametype === 6 || gametype === 7){
    $setText(statsLines, lines);
    $setText(statsLevel, "Lv. " + level);
  }else if (gametype === 3){
    if (gameparams.digOffset || gameparams.digOffset !== 0){
      $setText(statsLevel, gameparams.digOffset + "+");
    }else{
      $setText(statsLevel, "");
    }
    $setText(statsLines, lines);
  }//else if (gametype === 4){
  //  $setText(statsLines, digLines.length);
  //}
  else{
    $setText(statsLines, lines);
    $setText(statsLevel, "");
  }

  var light=['#ffffff','#EFB08C','#EDDD82','#8489C7','#FFDB94','#EFAFC5','#98DF6E','#6FC5C5','#9A7FD1','#78D4A3'];

  statsScore.style.color=(b2b===0?'':light[b2b%10]);
  statsScore.style.textShadow=(combo===0?'':('0 0 0.5em '+light[(combo-1)%10]));
  $setText(statsScore,scorestring(score.toString(), 2));
}
// ========================== View ============================================

/**
 * Draws grid in background.
 */
function bg(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#1c1c1c';
  for (var x = -1; x < ctx.canvas.width + 1; x += cellSize) {
    ctx.fillRect(x, 0, 2, ctx.canvas.height);
  }
  for (var y = -1; y < ctx.canvas.height + 1; y += cellSize) {
    ctx.fillRect(0, y, ctx.canvas.width, 2);
  }
}

/**
 * Draws a pre-rendered mino.
 */
function drawCell(x, y, color, ctx, darkness) {
  x = Math.floor(x * cellSize);
  y = Math.floor(y * cellSize);
  ctx.drawImage(spriteCanvas, color * cellSize, 0, cellSize, cellSize, x, y, cellSize, cellSize);
  if (darkness !== void 0) {
    //ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0,0,0,' + darkness + ')';
    ctx.fillRect(x, y, cellSize, cellSize);
    //ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Pre-renders all mino types in all colors.
 */
function makeSprite() {
  var shaded = [
    // 0         +10        -10        -20
    ['#c1c1c1', '#dddddd', '#a6a6a6', '#8b8b8b'],
    ['#25bb9b', '#4cd7b6', '#009f81', '#008568'],
    ['#3397d9', '#57b1f6', '#007dbd', '#0064a2'],
    ['#e67e23', '#ff993f', '#c86400', '#a94b00'],
    ['#efc30f', '#ffdf3a', '#d1a800', '#b38e00'],
    ['#9ccd38', '#b9e955', '#81b214', '#659700'],
    ['#9c5ab8', '#b873d4', '#81409d', '#672782'],
    ['#e64b3c', '#ff6853', '#c62c25', '#a70010'],
    ['#898989', '#a3a3a3', '#6f6f6f', '#575757'],
    ['#c1c1c1', '#dddddd', '#a6a6a6', '#8b8b8b'],
  ];
  var glossy = [
    //25         37         52         -21        -45
    ['#ffffff', '#ffffff', '#ffffff', '#888888', '#4d4d4d'],
    ['#7bffdf', '#9fffff', '#ccffff', '#008165', '#00442e'],
    ['#6cdcff', '#93feff', '#c2ffff', '#00629f', '#002c60'],
    ['#ffc166', '#ffe386', '#ffffb0', '#aa4800', '#650500'],
    ['#ffff6a', '#ffff8c', '#ffffb8', '#b68a00', '#714f00'],
    ['#efff81', '#ffffa2', '#ffffcd', '#6b9200', '#2c5600'],
    ['#dc9dfe', '#ffbeff', '#ffe9ff', '#5d287e', '#210043'],
    ['#ff9277', '#ffb497', '#ffe0bf', '#a7000a', '#600000'],
    ['#cbcbcb', '#ededed', '#ffffff', '#545454', '#1f1f1f'],
    ['#ffffff', '#ffffff', '#ffffff', '#888888', '#4d4d4d'],
  ];
  var tgm = [
    ['#ababab', '#5a5a5a', '#9b9b9b', '#626262'],
    ['#00e8f0', '#0070a0', '#00d0e0', '#0080a8'],
    ['#00a8f8', '#0000b0', '#0090e8', '#0020c0'],
    ['#f8a800', '#b84000', '#e89800', '#c85800'],
    ['#e8e000', '#886800', '#d8c800', '#907800'],
    ['#78f800', '#007800', '#58e000', '#008800'],
    ['#f828f8', '#780078', '#e020e0', '#880088'],
    ['#f08000', '#a00000', '#e86008', '#b00000'],
    ['#7b7b7b', '#303030', '#6b6b6b', '#363636'],
    ['#ababab', '#5a5a5a', '#9b9b9b', '#626262'],
  ];

  spriteCanvas.width = cellSize * 10;
  spriteCanvas.height = cellSize;
  for (var i = 0; i < 10; i++) {
    var x = i * cellSize;
    if (settings.Block === 0) {
      // Shaded
      spriteCtx.fillStyle = shaded[i][1];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);

      spriteCtx.fillStyle = shaded[i][3];
      spriteCtx.fillRect(x, cellSize / 2, cellSize, cellSize / 2);

      spriteCtx.fillStyle = shaded[i][0];
      spriteCtx.beginPath();
      spriteCtx.moveTo(x, 0);
      spriteCtx.lineTo(x + cellSize / 2, cellSize / 2);
      spriteCtx.lineTo(x, cellSize);
      spriteCtx.fill();

      spriteCtx.fillStyle = shaded[i][2];
      spriteCtx.beginPath();
      spriteCtx.moveTo(x + cellSize, 0);
      spriteCtx.lineTo(x + cellSize / 2, cellSize / 2);
      spriteCtx.lineTo(x + cellSize, cellSize);
      spriteCtx.fill();
    } else if (settings.Block === 1) {
      // Flat
      spriteCtx.fillStyle = shaded[i][0];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);
    } else if (settings.Block === 2) {

      // Custom [Pure]
      var k = Math.max(~~(cellSize * 0.15), 1);
      spriteCtx.shadowBlur = 10;
      spriteCtx.shadowColor = '#ffffff';
      var grd = spriteCtx.createLinearGradient(0,0, 100,100);
      grd.addColorStop(0, '#4da3ff');
      grd.addColorStop(1, '#db87ff');

      // Fill with gradient
      spriteCtx.fillStyle = grd;

      // Set the fill style and draw a rectangle
      spriteCtx.fillRect(x + k, k, cellSize - k * 2, cellSize - k * 2);
      spriteCtx.strokeStyle = '#ffffff';
      spriteCtx.lineWidth = 2;
      spriteCtx.strokeRect(x + k - 1, k - 1, cellSize - k * 2 + 2, cellSize - k * 2 + 2);

    } else if (settings.Block === 3 || settings.Block === 4) {
      var k = Math.max(~~(cellSize * 0.125), 1);

      spriteCtx.fillStyle = tgm[i][1];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);
      spriteCtx.fillStyle = tgm[i][0];
      spriteCtx.fillRect(x, 0, cellSize, ~~(cellSize / 2));

      var grad = spriteCtx.createLinearGradient(x, k, x, cellSize - k);
      grad.addColorStop(0, tgm[i][2]);
      grad.addColorStop(1, tgm[i][3]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x + k, k, cellSize - k*2, cellSize - k*2);

      var grad = spriteCtx.createLinearGradient(x, k, x, cellSize);
      grad.addColorStop(0, tgm[i][0]);
      grad.addColorStop(1, tgm[i][3]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x, k, k, cellSize - k);

      var grad = spriteCtx.createLinearGradient(x, 0, x, cellSize - k);
      grad.addColorStop(0, tgm[i][2]);
      grad.addColorStop(1, tgm[i][1]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x + cellSize - k, 0, k, cellSize - k);
    }
  }
}

/**
 * Clear canvas.
 */
function clear(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws a 2d array of minos.
 */
function draw(tetro, cx, cy, ctx, color, darkness) {
  for (var x = 0, len = tetro.length; x < len; x++) {
    for (var y = 0, wid = tetro[x].length; y < wid; y++) {
      if (tetro[x][y]) {
        drawCell(x + cx, y + cy, color !== void 0 ? color : tetro[x][y], ctx, darkness);
      }
    }
  }
}

// [Pure] Draw ghost
function drawGhost(tetro, cx, cy, ctx, color, darkness) {
  ctx.strokeStyle = '#ffffff';
  for (var x = 0, len = tetro.length; x < len; x++) {
    for (var y = 0, wid = tetro[x].length; y < wid; y++) {
      var xGrid = Math.floor((x + cx) * cellSize);
      var yGrid = Math.floor((y + cy) * cellSize);
      if (tetro[x][y]) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';

        // Draw top lines
        if (y > 0) {
          if (!tetro[x][y - 1]) {
            ctx.strokeRect(xGrid, yGrid, cellSize, 1);
          }
        } else {
          ctx.strokeRect(xGrid, yGrid, cellSize, 1);
        }

        // Draw bottom lines
        if (y < 3) {
          if (!tetro[x][y + 1]) {
            ctx.strokeRect(xGrid, yGrid + cellSize, cellSize, 1);
          }
        } else {
          ctx.strokeRect(xGrid, yGrid + cellSize, cellSize, 1);
        }

        // Draw left lines
        if (x > 0) {
          if (!tetro[x - 1][y]) {
            ctx.strokeRect(xGrid, yGrid, 1, cellSize);
          }
        } else {
          ctx.strokeRect(xGrid, yGrid, 1, cellSize);
        }

        // Draw right lines
        if (x < 3) {
          if (!tetro[x + 1][y]) {
            ctx.strokeRect(xGrid + cellSize, yGrid, 1, cellSize);
          }
        } else {
          ctx.strokeRect(xGrid + cellSize, yGrid, 1, cellSize);
        }
      }
    }
  }
  ctx.shadowColor = '#00000000';
}


// ========================== Controller ======================================

function keyUpDown(e) {
  // TODO send to menu or game depending on context.
  if ([32,37,38,39,40].indexOf(e.keyCode) !== -1)
    e.preventDefault();
  //TODO if active, prevent default for binded keys
  //if (bindsArr.indexOf(e.keyCode) !== -1)
  //  e.preventDefault();
  if (e.type === "keydown" && e.keyCode === binds.pause) {
    if (paused) {
      unpause();
    } else {
      pause();
    }
  }
  if (e.type === "keydown" && e.keyCode === binds.retry) {
    init(gametype,gameparams);
  }
  if (!watchingReplay) {
    if (e.type === "keydown") {
      if (e.keyCode === binds.moveLeft) {
        keysDown |= flags.moveLeft;
      } else if (e.keyCode === binds.moveRight) {
        keysDown |= flags.moveRight;
      } else if (e.keyCode === binds.moveDown) {
        keysDown |= flags.moveDown;
      } else if (e.keyCode === binds.hardDrop) {
        keysDown |= flags.hardDrop;
      } else if (e.keyCode === binds.rotRight) {
        keysDown |= flags.rotRight;
      } else if (e.keyCode === binds.rotLeft) {
        keysDown |= flags.rotLeft;
      } else if (e.keyCode === binds.rot180) {
        keysDown |= flags.rot180;
      } else if (e.keyCode === binds.moveLeft3) {
        keysDown |= flags.moveLeft3;
      } else if (e.keyCode === binds.moveRight3) {
        keysDown |= flags.moveRight3;
      } else if (e.keyCode === binds.holdPiece) {
        keysDown |= flags.holdPiece;
      }
    }
    else if (e.type === "keyup")
    {
      if (e.keyCode === binds.moveLeft && keysDown & flags.moveLeft) {
        keysDown ^= flags.moveLeft;
      } else if (e.keyCode === binds.moveRight && keysDown & flags.moveRight) {
        keysDown ^= flags.moveRight;
      } else if (e.keyCode === binds.moveDown && keysDown & flags.moveDown) {
        keysDown ^= flags.moveDown;
      } else if (e.keyCode === binds.hardDrop && keysDown & flags.hardDrop) {
        keysDown ^= flags.hardDrop;
      } else if (e.keyCode === binds.rotRight && keysDown & flags.rotRight) {
        keysDown ^= flags.rotRight;
      } else if (e.keyCode === binds.rotLeft && keysDown & flags.rotLeft) {
        keysDown ^= flags.rotLeft;
      } else if (e.keyCode === binds.rot180 && keysDown & flags.rot180) {
        keysDown ^= flags.rot180;
      } else if (e.keyCode === binds.moveLeft3 && keysDown & flags.moveLeft3) {
        keysDown ^= flags.moveLeft3;
      } else if (e.keyCode === binds.moveRight3 && keysDown & flags.moveRight3) {
        keysDown ^= flags.moveRight3;
      } else if (e.keyCode === binds.holdPiece && keysDown & flags.holdPiece) {
        keysDown ^= flags.holdPiece;
      }
    }
  }
}
addEventListener('keydown', keyUpDown, false);
addEventListener('keyup', keyUpDown, false);

// ========================== Loop ============================================

//TODO Cleanup gameloop and update.
/**
 * Runs every frame.
 */
function update() {
  //TODO Das preservation broken.
  if (lastKeys !== keysDown && !watchingReplay) {
    replay.keys[frame] = keysDown;
  } else if (frame in replay.keys) {
    keysDown = replay.keys[frame];
  }

  //if (piece.dead) {
  //  piece.new(preview.next());
  //}

  do { // for breaking
    if (!(lastKeys & flags.holdPiece) && flags.holdPiece & keysDown) {
      piece.hold(); // may cause death
    }
    if (gameState === 9) {
      break;
    }

    if (flags.rotLeft & keysDown && !(lastKeys & flags.rotLeft)) {
      piece.rotate(-1);
      piece.finesse++;
    } else if (flags.rotRight & keysDown && !(lastKeys & flags.rotRight)) {
      piece.rotate(1);
      piece.finesse++;
    } else if (flags.rot180 & keysDown && !(lastKeys & flags.rot180)) {
      piece.rotate(2);
      piece.finesse++;
    }

    piece.checkShift();

    if (flags.moveDown & keysDown) {
      piece.shiftDown();
      //piece.finesse++;
    }
    if (!(lastKeys & flags.hardDrop) && flags.hardDrop & keysDown) {
      frameLastHarddropDown = frame;
      piece.hardDrop();
    }

    piece.update(); // may turn to locked, even lock out death.
    if (gameState === 9) {
      break;
    }

    if(gametype === 3) { //Dig
      var fromLastRise = frame-frameLastRise;
      var fromLastHD = (flags.hardDrop & keysDown)?(frame-frameLastHarddropDown):0;

      var arrRow = [8,8,8,8,8,8,8,8,8,8];
      var curStage = 0, objCurStage;

      while(curStage<arrStages.length && arrStages[curStage].begin <= lines + (gameparams.digOffset || 0)) {
        curStage++;
      }
      curStage--;
      objCurStage = arrStages[curStage];
      if(fromLastRise >= objCurStage.delay || (fromLastHD >= 20 && fromLastRise >= 15)) {
        //IJLOSTZ
        var arrRainbow=[
          2,-1,1,5,4,3,7,6,-1,8,
          8,8,8,6,6,2,1,5,8,-1,
          7,7,-1,8,8];
        var idxRainbow,flagAll,colorUsed;
        idxRainbow = ~~(objCurStage.begin/100);
        flagAll = (~~(objCurStage.begin/50))%2;
        if(idxRainbow >= arrRainbow.length) {
          idxRainbow = arrRainbow.length - 1;
        }
        colorUsed = arrRainbow[idxRainbow];
        for(var x=0; x<stack.width; x+=(flagAll===1?1:(stack.width-1))) {
          if(colorUsed===-1) {
            arrRow[x]=~~(rng.next()*8+1);
          } else {
            arrRow[x]=colorUsed;
          }
        }

        objCurStage.gen(arrRow);
        stack.rowRise(arrRow, piece);
        frameLastRise=frame;
        sound.playse("garbage");
      }
    }else if(gametype===7) { //dig zen
      for(;lastPiecesSet<piecesSet;lastPiecesSet++){
        digZenBuffer++;
        var piecePerRise=[
          8,6.5,4,3.5,10/3,
          3,2.8,2.6,2.4,2.2,
          2][level>10?10:level];
        if(digZenBuffer-piecePerRise > -0.000000001){
          digZenBuffer-=piecePerRise;
          if(Math.abs(digZenBuffer) < -0.000000001){
            digZenBuffer = 0;
          }
          var arrRow=[8,8,8,8,8,8,8,8,8,8];
          arrRow[~~(rng.next()*10)]=0;

          stack.rowRise(arrRow, piece);
          sound.playse("garbage");
        }
      }
    }
  } while(false) // break when game over

  updateScoreTime();

  if (lastKeys !== keysDown) {
    lastKeys = keysDown;
  }
}

var inloop = false; //debug
function gameLoop() {

  //if (frame % 60 == 0) console.log("running");
  var fps=60;

  if (!paused && gameState !== 3) {
    requestAnimFrame(gameLoop);

    // anti turbulance
    // requestanimationframe is not perfectly 60fps, also with turbulance
    var repeat = (Date.now() - startTime - pauseTime)/1000*fps - frame;
    if (repeat>=2) {
      repeat = Math.floor(repeat);
      frameSkipped += repeat-1;
    } else if (repeat <= 0) {
      repeat = Math.ceil(repeat);
      frameSkipped += repeat-1;
    } else {
      repeat = 1;
    }

    for (var repf=0;repf<repeat;repf++) {
      //TODO check to see how pause works in replays.


      if (gameState === 0) {
        // Playing

          update();

      } else if (gameState === 2 || gameState === 4) {

        if (lastKeys !== keysDown && !watchingReplay) {
          replay.keys[frame] = keysDown;
        } else if (frame in replay.keys) {
          keysDown = replay.keys[frame];
        }
        // DAS Preload
        if (keysDown & flags.moveLeft) {
          piece.shiftDelay = settings.DAS;
          piece.shiftReleased = false;
          piece.shiftDir = -1;
        } else if (keysDown & flags.moveRight) {
          piece.shiftDelay = settings.DAS;
          piece.shiftReleased = false;
          piece.shiftDir = 1;
        } else {
          piece.shiftDelay = 0;
          piece.shiftReleased = true;
          piece.shiftDir = 0;
        }
        if (flags.rotLeft & keysDown && !(lastKeys & flags.rotLeft)) {
          piece.irsDir = -1;
          piece.finesse++;
          //console.log("IRS");
        } else if (flags.rotRight & keysDown && !(lastKeys & flags.rotRight)) {
          piece.irsDir = 1;
          piece.finesse++;
          //console.log("IRS");
        } else if (flags.rot180 & keysDown && !(lastKeys & flags.rot180)) {
          piece.irsDir = 2;
          piece.finesse++;
          //console.log("IRS");
        }
        if (!(lastKeys & flags.holdPiece) && flags.holdPiece & keysDown) {
          if (gametype === 1 && gameparams.marathonType === 1){
          } else {
            piece.ihs = true;
            //console.log("IHS");
          }
        }
        if (lastKeys !== keysDown) {
          lastKeys = keysDown;
        }
        if (gameState === 2) {
          // Count Down
          if (frame === 0) {
            $setText(msg,'READY');
          } else if (frame === ~~(fps*5/6)) {
            $setText(msg,'GO!');
          } else if (frame === ~~(fps*10/6)) {
            $setText(msg,'');
            scoreStartTime = Date.now();
          }
          scoreTime = 0;
        } else {
          // are
          piece.are++;
          updateScoreTime();
        }
        if (
          (gameState === 2 && frame >= fps*10/6) ||
          (gameState === 4 && piece.are >= piece.areLimit)
        ) {
          gameState = 0;
          // console.time("123");
          if (piece.ihs) {
            piece.index = preview.next();
            piece.hold();
          } else {
            piece.new(preview.next());
          }
          piece.draw();
          // console.timeEnd("123");
          // console.log(frame);
          updateScoreTime();
        }

      } else if (gameState === 9 || gameState === 1) {
        if (toGreyRow >= stack.hiddenHeight) {
          /**
           * Fade to grey animation played when player loses.
           */
          if (frame % 2) {
            for (var x = 0; x < stack.width; x++) {
               /* farter */ //WTF gamestate-1
              if (stack.grid[x][toGreyRow])
                stack.grid[x][toGreyRow] =
                  (gameState === 9 ? 8 : 0);
            }
            stack.draw();
            toGreyRow--;
          }
        } else {
          //clear(activeCtx);
          //piece.dead = true;
          trysubmitscore();
          gameState = 3;
        }
      }
      frame++;
    }

    statistics();

    // TODO improve this with 'dirty' flags.
    /* farter */ // as you draw for lock delay brightness gradient... give this up..

    if (piece.x !== lastX ||
    Math.floor(piece.y) !== lastY ||
    piece.pos !== lastPos ||
    piece.lockDelay !== lastLockDelay ||
    piece.dirty) {
      piece.draw();
    }
    lastX = piece.x;
    lastY = Math.floor(piece.y);
    lastPos = piece.pos;
    lastLockDelay = piece.lockDelay;
    piece.dirty = false;

    if (stack.dirty) {
      stack.draw();
    }
    if (preview.dirty) {
      preview.draw();
    }

  } else {
    console.log("stop inloop",inloop)
    inloop = false;
  }
}

// called after piece lock, may be called multple times when die-in-one-frame
function checkWin(){
  if (gametype === 0 && lineLimit >= 40) { // 40L + longer sprints
    if (lines >= lineLimit) {
      gameState = 1;
      if (gameparams.backFire){
        msg.innerHTML = "GREAT!";
      } else {
        var rank = null;
        var time = (Date.now() - scoreStartTime - pauseTime) / 1000;
        if (lineLimit !== 40) {
          time = time * 40 / lineLimit;
        }
        for (var i in sprintRanks) {
          if (time > sprintRanks[i].t) {
            rank = sprintRanks[i];
            break;
          }
        }
        msg.innerHTML = rank.b +"</small>";
      }
      piece.dead = true;
      menu(3);
      sound.playse("endingstart");
    }
  } else {
    var isend=false;
    if (gametype === 1) { // Marathon
      if (settings.Gravity !== 0 && lines>=200) { // not Auto, limit to 200 Lines
        isend=true;
      }
    } else if (gametype === 5) { // Score Attack
      if (lines>=lineLimit) { // not Auto, limit to 200 Lines
        isend=true;
      }
    } else if (gametype === 4) { // Dig race
      if (digLines.length === 0) {
        isend=true;
      }
    } else if (gametype === 6) { // 20G
      if (lines>=300) { // 200 + 100
        isend=true;
      }
    } else if (gametype === 7) { // dig zen
      if (lines>=400) { // 300 + 100
        isend=true;
      }
    } else if (gametype === 0) { // misc line limited modes
      if (lines>=lineLimit) {
        isend=true;
      }
    }
    if(isend){
      gameState = 1;
      $setText(msg,'GREAT!');
      piece.dead = true;
      menu(3);
      sound.playse("endingstart");
    }
  }
}

var playername=void 0;

function requireplayername(){
  if(playername===void 0)
    playername=prompt("Enter your name for leaderboard\n","");
  if(playername===null)
    playername="anonymous";
  if(playername==="")
    playername="unnamed";
}

function trysubmitscore() {
  if(watchingReplay)
    return;
  var obj={req:"ranking"};
  var time = scoreTime;

  if(gametype===0) // 40L
    obj.mode="sprint" +
      (gameparams.lineLimit?""+gameparams.lineLimit:"") +
      (gameparams.pieceSet?["","noi","alli"][gameparams.pieceSet]:"") +
      (gameparams.backFire?["","bf1","bf2","bf3"][gameparams.backFire]:"");
  else if(gametype===3) // dig
    obj.mode="dig" + (gameparams.digOffset?gameparams.digOffset:"");
  else if(gametype===4) // dig race
    obj.mode="digrace" + (gameparams.digraceType?gameparams.digraceType:"checker");
  else if(gametype===1) // marathon
    obj.mode="marathon" + (gameparams.marathonType?["","cls"][gameparams.marathonType]:"");
  else if(gametype===5) // score attack
    obj.mode="score";
  else if(gametype===6) // 20g
    obj.mode="marathon20g";
  else if(gametype===7) // dig zen
    obj.mode="digzen";
  else
    return;

  if(
    (gametype===0 && gameState===1)||
    (gametype===3 && gameState===9)||
    (gametype===4 && gameState===1)||
    (gametype===1 && settings.Gravity === 0)||
    (gametype===5)||
    (gametype===6)||
    (gametype===7)||
    false
  ){
    requireplayername();
    obj.lines=lines;
    obj.time=time;
    obj.score=score.toString();
    obj.name=playername;
    obj.replay=curreplaydata();

    submitscore(obj);
  } else{
    submitscore(obj);
  }
}

function tryreplaydata() {
/*
  var strreplay = prompt("Paste replay data here: 在此贴入录像数据：");
  if (strreplay === null)
    return;
*/
  var strreplay = replaydata.value;
  init('replay',strreplay);
}

function showreplaydata(strreplay) {
  /*
  var objblob = new Blob([strreplay],{type:"text/plain"});
  var url=URL.createObjectURL(objblob);
  window.open(url);
  */
  replaydata.value = strreplay;
  replaydata.select();
  menu(6,1);
}

function curreplaydata() {
  //var strreplay = Compress(JSON.stringify(replay));
  var objKeys = replay.keys;
  replay.keys = keysEncode(replay.keys);
  var strreplay = JSON.stringify(replay);
  replay.keys = objKeys;
  //strreplay = strreplay + Compress(strreplay);
  return strreplay;
}
