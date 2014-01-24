(function() {

  var API_KEY = 'eb18642b5b220484864483b8e21386c3';
      //  ^ get your own at https://imgur.com/register/api_anon
      //    as it is limited to 50 uploads an hour!
  var video        = document.querySelector('#video'),
      canvas       = document.querySelector('#canvas'),
      vidcontainer = document.querySelector('#videocontainer'),
      continuous   = document.querySelector('#continuous');

 var ctx    = canvas.getContext('2d'),
     streaming    = false,
     width  = 200,
     height = 200;
 var iconHeight = 128;
 var iconWidth = 128;

 var audio = document.querySelectorAll('audio'),
     sounds = {
        shutter: audio[0],
        rip:     audio[1],
        takeoff: audio[2]
      };

  function init() {
    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
        video: true,
        audio: false
      },
      function(stream) {
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
        }
        video.play();
        video.style.width = width + 'px';
        video.style.height = height + 'px';
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );
  }

  init();

  function sendAvatar(imgdata,imgfile) {
    var myEvent = new CustomEvent("set-avatar", {
      detail: {
        imgdata: imgdata
      }
    });
    window.dispatchEvent(myEvent);
  };


  function takepicture() {
    sounds.shutter.play();
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    var chopTop = 0;
    var chopLeft = 0;
    var size;
    if (video.videoHeight > video.videoWidth) {
      chopTop = (video.videoHeight - video.videoWidth) / 2;
      size = video.videoWidth;
    } else {
      chopLeft = (video.videoWidth - video.videoHeight) / 2;
      size = video.videoHeight;
    }
    ctx.drawImage(
      video,
      // Source left/top:
      chopLeft, chopTop,
      // Source width/height:
      size, size,
      // Dest left/top:
      0, 0,
      // Dest width/height:
      canvas.width, canvas.height
      );
    ctx.restore();

    // take picture and upload are the same!
    sendAvatar(canvas.toDataURL('image/jpeg', 0.9));
  }

  /* Event Handlers */

  video.addEventListener('play', function(ev){
    if (!streaming) {
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.width = iconWidth;
      canvas.height = iconHeight;
      streaming = true;
      vidcontainer.classname = 'playing';
    }
  }, false);

  document.addEventListener('keydown', function(ev) {
    if (ev.which === 32 || ev.which === 37 || ev.which === 39) {
      ev.preventDefault();
    }
    if (ev.which === 32) {   // space
      takepicture();
    }
  },false);

  video.addEventListener('click', function(ev){
    takepicture();
  }, false);

  var runnerId;

  continuous.addEventListener('change', function() {
    var state = continuous.checked;
    if (! state) {
      clearTimeout(runnerId);
    } else {
      runnerId = setInterval(function () {
        // FIXME: should have something here to check if the hotdish
        // window is in the foreground
        takepicture();
      }, 1000 * 60 * 5);
    }
  }, false);

})();
