function Preview() {
  grabBag = this.gen();
}
Preview.prototype.init = function() {
  //XXX fix ugly code lolwut /* farter */
  while (1) {
    this.grabBag = this.gen();
    break;
    //if ([3,4,6].indexOf(this.grabBag[0]) === -1) break;
  }
  if (this.grabBag.length <= 7) {
    this.grabBag.push.apply(this.grabBag, this.gen());
  }
  this.dirty = true;
  this.draw();
}
Preview.prototype.next = function() {
  var next;
  next = this.grabBag.shift();
  if (this.grabBag.length <= 7) {
    this.grabBag.push.apply(this.grabBag, this.gen());
  }
  this.dirty = true;
  return next;
  //TODO Maybe return the next piece?
}
/**
 * Creates a "grab bag" of the 7 tetrominos.
 */
Preview.prototype.gen = function() {
  var pieceList = void 0;
  if(gameparams && gameparams.pieceSet){
    switch(gameparams.pieceSet){
      case 1: pieceList=[1,2,3,4,5,6];break;
      case 2: pieceList=[0,0,0,0,0,0,0];break;
    }
  }else{
    pieceList= [0, 1, 2, 3, 4, 5, 6];
  }
  //return pieceList.sort(function() {return 0.5 - rng.next()});
  /* farter */ // proven random shuffle algorithm
  for (var i=0;i<pieceList.length-1;i++)
  {
    var temp=pieceList[i];
    var rand=~~((pieceList.length-i)*rng.next())+i;
    pieceList[i]=pieceList[rand];
    pieceList[rand]=temp;
  }
  return pieceList;
}
/**
 * Draws the piece preview.
 */
Preview.prototype.draw = function() {
  clear(previewCtx);
  var drawCount = (settings["Next"]===void 0) ? 6 : settings["Next"];
  var curY = 0;
  for (var i = 0; i < drawCount; i++) {
    var p = this.grabBag[i];
    var initInfo = RotSys[settings.RotSys].initinfo[p];
    var r = initInfo[2];
    var rect = pieces[p].rect[r];
    var h = Math.max(rect[3] - rect[1], 3);
    draw(
      pieces[p].tetro[r],
      -rect[0] + (4 - rect[2] + rect[0]) / 2,
      curY - rect[1] + (h - rect[3] + rect[1]) / 2,
      previewCtx,
      RotSys[settings.RotSys].color[p]
    );
    curY += h;
    //if(p===0)console.log(-rect[r][0], (4 - rect[r][2] + rect[r][0]) / 2);
  }
  this.dirty = false;
}
var preview = new Preview();
