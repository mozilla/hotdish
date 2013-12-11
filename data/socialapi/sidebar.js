var match = /groupId=([^&]*)/.exec(location.search);
var groupId = match[1];
match = /clientId=([^&]*)/.exec(location.search);
var clientId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + groupId;

var hub = mixinEvents({});
var addon = mixinEvents({});

var list = {
  _peers: {},
  get: function (clientId) {
    if (! this._peers[clientId]) {
      var peer = Peer(clientId);
      this._peers[clientId] = peer;
    }
    return this._peers[clientId];
  }
};

var Peer = Class({
  constructor: function (id) {
    this.clientId = id;
    this.avatar = null;
    this.name = null;
    this.color = null;
    this.isSelf = this.clientId == clientId;
    this.element = getTemplate("peer");
    $("#peers").append(this.element);
    this.update({});
  },

  update: function (msg) {
    this.avatar = msg.avatar || this.avatar;
    this.name = msg.name || this.name;
    this.color = msg.color || this.color;
    if (this.name) {
      this.element.find(".name").text(this.name);
    }
    if (this.color) {
      this.element.find(".bgcolor").css("background-color", this.color);
    }
    if (this.avatar) {
      this.element.find(".avatar").show().attr("src", this.avatar);
    } else {
      this.element.find(".avatar").hide();
    }
    if (this.isSelf) {
      this.element.find("if-self").show();
    } else {
      this.element.find("if-self").hide();
    }
  },

  addTab: function (msg) {
    console.log("adding tab", msg);
    var el = getTemplate("url");
    el.find("a").attr("href", msg.url);
    el.find("a").text(msg.title);
    this.element.find(".url-list").prepend(el);
  }
});


function getTemplate(name) {
  var el = $("#template-" + name);
  assert(el.length);
  el = el.clone();
  el.attr("id", null);
  return el;
}


$(function () {

  var channel = WebSocketChannel(hubUrl);
  channel.onmessage = function (msg) {
    var li = getTemplate("message");
    li.find("pre").text(JSON.stringify(msg, null, 2));
    $("#messages").append(li);
    if (msg.type == "init-connection") {
      return;
    }
    if (msg.addon) {
      if (msg.addon == clientId) {
        addon.emit(msg.type, msg);
      }
      return;
    }
    if (msg.sidebar) {
      return;
    }
    msg.peer = list.get(msg.clientId);
    if (msg.type == "hello" || msg.type == "hello-back") {
      msg.peer.update(msg);
    }
    hub.emit(msg.type, msg);
  };

  $("#request-current").click(function () {
    send({
      type: "request-current"
    });
  });

  $("#show-messages").click(function () {
    $("#messages-container").show();
    $("#messages-hidden").hide();
  });

  $("#hide-messages").click(function () {
    $("#messages-container").hide();
    $("#messages-hidden").show();
  });

  $(document).on("click", ".show-edit", function () {
    send({
      type: "show-edit"
    });
  });

  function send(msg) {
    msg.sidebar = clientId;
    channel.send(msg);
  }

  hub.on("tab-pageshow", function (msg) {
    if (msg.url.indexOf("about:") === 0
        || msg.url.indexOf("resource:") === 0) {
      return;
    }
    msg.peer.addTab(msg);
  });

  send({
    type: "ready"
  });

});
