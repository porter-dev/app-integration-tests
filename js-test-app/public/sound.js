function Sound() {
  var itworks=false;
  var wavenames="bravo,endingstart,erase1,erase2,erase3,erase4,gameover,garbage,lock,tspin0,tspin1,tspin2,tspin3".split(",");
  var waves={};
  this.init=function(){
    if(itworks===false){
      try{
        for(var i=0;i<wavenames.length;i++){
          var iname = wavenames[i];
          var wave = document.createElement("AUDIO");
          wave.src="se/"+iname+".mp3";
          wave.load();
          waves[iname] = wave;
        }
        itworks=true;
      }catch(e){
        alert("sound doesn't work.")
      };
    }
  };
  this.playse=function(name,arg){
    if(itworks){
      try{
        if(typeof arg !== "undefined"){
          name+=arg;
        }
        if(typeof waves[name] !== "undefined"){
          if(settings.Sound){
            waves[name].volume=settings.Volume/100;
            waves[name].currentTime=0;
            waves[name].play();
          }
        }
      }
      catch(e){
        console.error("sound error"+e.toString());
      }
    }
  }
}

var sound = new Sound();