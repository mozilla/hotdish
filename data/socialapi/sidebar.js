var match = /groupId=([^&]*)/.exec(location.search);
var groupId = match[1];
match = /clientId=([^&]*)/.exec(location.search);
var clientId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + groupId;

$(function () {

  var channel = new WebSocketChannel(hubUrl);
  channel.onmessage = function (msg) {
    var pre = $("<pre>");
    pre.text(JSON.stringify(msg, null, 2));
    var li = $("<li>").append(pre);
    $("#messages").append(li);
  };

});
