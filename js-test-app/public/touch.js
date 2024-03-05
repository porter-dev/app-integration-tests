function FollowingButton(button)
{
  this.rectX0 = button.offsetLeft;
  this.rectY0 = button.offsetTop;
  this.rectX1 = button.offsetLeft + button.offsetWidth;
  this.rectY1 = button.offsetTop + button.offsetHeight;
  this.x = (this.rectX0 + this.rectX1) / 2;
  this.y = (this.rectY0 + this.rectY1) / 2;
  this.recentTouches = [];
  this.enabled = true;
}

function FollowingButtonSet(){

}

FollowingButtonSet.RANGE = 96;

FollowingButtonSet.prototype.touchStart = function(pos) {
  
}

FollowingButtonSet.prototype.posToBinds = function(pos) {
  var mindist = Infinity;
  var minbtnid = void 0;
  for(var i = 0; i < touchButtons.length; i++){
    var btnflw = touchButtons[i].follow;
    var dist = Math.hypot(pos.x - btnflw.x, pos.y - btnflw.y);
    if(dist < mindist){
      mindist = dist;
      minbtnid = i;
    }
  }
  return minbtnid;
}

for(var i = 0; i < touchButtons.length; i++){
  var btn = touchButtons[i];
  btn.follow = new FollowingButton(btn);
}

function touchButtonsLayout()
{
  var dpiX = 96;
  var dpiY = 96;
  var winW = window.innerWidth / dpiX;
  var winH = window.innerHeight / dpiY;
  var buttonH = 0.7, buttonW = 1, fontSize=0.55, margin=0.1, unit="in";

  var setPos = function(elem, posX, posY, sizeW, sizeH,
    alignX, alignY, offsetX, offsetY, clientW, clientH)
  {
    elem.style.width = "" + sizeW + unit;
    elem.style.height = "" + sizeH + unit;
    // border ignored, for now
    elem.style.left = "" + (offsetX + alignX * 0.5 * (clientW - sizeW) + posX * sizeW - ( (alignX-1) * margin/2 )) + unit;
    elem.style.top = "" + (offsetY + alignY * 0.5 * (clientH - sizeH) + posY * sizeH - ( (alignY-1) * margin/2 )) + unit;
    elem.style.display = "block";
    elem.style.fontSize = "" + fontSize + unit;
  }

  var layouts = { //function array
    "NONE":
    function() {
      for (var i = 0, len = touchButtons.length; i < len; i++)
        touchButtons[i].style.display = "none";
    },
    "KBD_R":
    function() {
      setPos(touchRotLeft,  0, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchRot180,   0.5, -2, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchRotRight, 1, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchHold,     1.5, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchRight,    0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchLeft,     -2, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchDown,     -1, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchDrop,     -1, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
    },
    "KBD_L":
    function() {
      setPos(touchRotLeft,  -1, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRot180,   -0.4, -2, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRotRight, 0, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchHold,     -1.5, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRight,    2, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchLeft,     0, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchDown,     1, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchDrop,     1, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
    },
    "JOY":
    function() {
      var oy/*offset Y by block*/,ay/*align Y*/;
      if (winH-winW>buttonH*1.5) {
        oy=-1; ay=2;
      } else {
        oy=0; ay=1;
      }
      /* single finger */
      buttonW = 0.8;
      if ((winW-0.1)/4<buttonW) {
        buttonW=(winW-0.1)/4;
      }
      setPos(touchRotLeft,  -0.5, 1+oy, buttonW, buttonH, 2, ay, 0, 0, winW, winH);
      setPos(touchRot180,   -0.5, -1+oy, buttonW, buttonH, 2, ay, 0, 0, winW, winH);
      setPos(touchRotRight, 0, 0+oy, buttonW, buttonH, 2, ay, 0, 0, winW, winH);
      setPos(touchHold,     -1, 0+oy, buttonW, buttonH, 2, ay, 0, 0, winW, winH);
      setPos(touchRight,    1, 0+oy, buttonW, buttonH, 0, ay, 0, 0, winW, winH);
      setPos(touchLeft,     0, 0+oy, buttonW, buttonH, 0, ay, 0, 0, winW, winH);
      setPos(touchDown,     0.5, 1+oy, buttonW, buttonH, 0, ay, 0, 0, winW, winH);
      setPos(touchDrop,     0.5, -1+oy, buttonW, buttonH, 0, ay, 0, 0, winW, winH);
    },
    "NARROW":
    function() {
      setPos(touchLeft,     -2, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRight,    0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      if (winH-winW>buttonH*1.5) {
        setPos(touchDown,     -1, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchDrop,     -1, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      } else {
        setPos(touchDown,     0, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchDrop,     -1, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      }
      setPos(touchRotLeft,  0, -1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchRotRight, 0, 0, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchHold,     0, 1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchRot180,   0, -2.4, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
    },
    "NARROW_L":
    function() {
      setPos(touchRotLeft,   -2, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRotRight,  -1, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchDrop,      0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      if (winH-winW>buttonH*1.5) {
        setPos(touchRot180,     -1, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      } else {
        setPos(touchRot180,      0, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      }
      setPos(touchLeft,    0, -1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchDown,    0, 0, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchRight,   0, 1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      setPos(touchHold,    0, -2.4, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
    },
    "NARROW_LM":
    function() {
      setPos(touchLeft,     0, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchRight,    2, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      if (winH-winW>buttonH*1.5) {
        setPos(touchDown,     1, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchDrop,     1, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      }
      else {
        setPos(touchDown,     0, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchDrop,     1, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      }
      setPos(touchRotLeft,  0, -1.2, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRotRight, 0, -2.4, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchHold,     0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRot180,   0, -3.6, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
    },

    "DELUXE":
    function() {
      buttonW = 0.8;
      if ((winW-0.1)/4<buttonW) {
        buttonW=(winW-0.1)/4;
      }
      setPos(touchLeft,     0, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchRight,    1, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      setPos(touchDown,     0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchDrop,     0, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRotLeft,  -1, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchRotRight, -1, -1, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      setPos(touchHold,     0.5, -1, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      //setPos(touchRot180,   0, -buttonH*2.4, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      touchRot180.style.display = "none";
    },

  };

  setPos(touchLayout, 0, 0, buttonW, buttonH, 2, 0, 0, 0, winW, winH);
  if(currLayout === -2) { // none
    layouts["NONE"]();
  }else if(currLayout === -1) { // auto detection
    if(winW<buttonW*3) {
      layouts["NONE"]();
    }
    else if((winW-(winH*0.5)>buttonW*4.5) ||
      (winH-winW>4*buttonH && winW>buttonW*5.5)) {
      layouts["KBD_R"]();
    }
    else if(winW-(winH*0.5)>buttonW*3) {
      layouts["JOY"]();
    }
    else if(winH-winW>0) {
      layouts["NARROW"]();
    }
    else if(winW>=buttonW*4) {
      layouts["DELUXE"]();
    }
    else {
      layouts["NONE"]();
    }
  }
  else {
    layouts[["KBD_R","KBD_L","JOY","NARROW","NARROW_L","NARROW_LM","DELUXE"][currLayout]]();
  }
}

function touch(e)
{
  var winH = window.innerHeight, winW = window.innerWidth;
  //if (e.type==="touchmove")
    //e.preventDefault();
  if ((e.type === "touchstart" || e.type === "click") && e.target === touchLayout) {
    currLayout++;
    if (currLayout === nLayouts) {
      currLayout = -2; //none, auto, 0, 1, 2...
    }
    resize();
  }
  if (e.type === "touchstart" || e.type === "touchmove" || e.type === "touchend") {
    for (var i in binds)
      keyUpDown({
        type: "keyup",
        keyCode: binds[i],
        preventDefault: function(){}
      });
    for (var i = 0, l = e.touches.length; i < l; i++) {
      var tX = e.touches[i].pageX, tY = e.touches[i].pageY;
      for (var j = 0; j < touchButtons.length; j++) {
        var oRef = touchButtons[j];
        if (tX>=oRef.offsetLeft && tX<oRef.offsetLeft+oRef.offsetWidth &&
          tY>=oRef.offsetTop && tY<oRef.offsetTop+oRef.offsetHeight) {
          keyUpDown({
            type: "keydown",
            keyCode: binds[oRef.bindsMemberName],
            preventDefault: function(){}
          });
          e.preventDefault();
        }
      }
    }
  }
}

function preventDefault(e) {
  e.preventDefault();
}
document.addEventListener('touchstart',touch, false);
document.addEventListener('touchmove',touch, false);
document.addEventListener('touchend',touch, false);
document.addEventListener('click',touch, false);

document.addEventListener('gesturestart',preventDefault,false);
document.addEventListener('gestureend',preventDefault,false);
document.addEventListener('gesturechange',preventDefault,false);