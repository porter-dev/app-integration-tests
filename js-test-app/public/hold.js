function Hold() {
  this.piece=0;
}
Hold.prototype.draw = function() {
  clear(holdCtx);
  var p = this.piece;
  var initInfo = RotSys[settings.RotSys].initinfo[p];
  var rect = pieces[p].rect;
  draw(
    pieces[p].tetro[initInfo[2]],
    -rect[initInfo[2]][0] + (4 - rect[initInfo[2]][2] + rect[initInfo[2]][0]) / 2,
    -rect[initInfo[2]][1] +
      (3 - rect[initInfo[2]][3] + rect[initInfo[2]][1]) / 2
      ,
    holdCtx,
    RotSys[settings.RotSys].color[p]
  );
}
var hold = new Hold();
