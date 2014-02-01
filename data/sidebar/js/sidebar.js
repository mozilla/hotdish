var groupId;
var selfIdentity;
var clientId;

var hub = mixinEvents({});

addon.port.on("init", function (initData) {
  groupId = initData.groupId;
  selfIdentity = initData.selfIdentity;
  clientId = initData.selfIdentity.clientId;
  if (docReady) {
    init();
  }
});

addon.port.emit("ready-init");


function init() {

  function message(msg) {
    if (msg.type == "init-connection") {
      return;
    }
    msg.peer = getPeer(msg.clientId);
    msg.peer.lastMessage = Date.now();
    if (msg.type == "hello" || msg.type == "hello-back") {
      msg.peer.update(msg);
    }
    hub.emit(msg.type, msg);
  };

  addon.port.on("message", message);
  addon.port.on("internalMessage", function (msg) {
    msg.self = true;
    msg.clientId = clientId;
    msg.peer = selfIdentity;
    message(msg);
  });

  /*$(document).bind("click", ".request-current", function () {
    addon.port.emit("shareTab");
  });*/

  function send(msg) {
    addon.port.emit("send", msg);
  }

  $(document).on("click", ".push", function (ev) {
    addon.port.emit("push");
    return false;
  });

  function updateSelf() {
    message({
      type: "hello",
      avatar: selfIdentity.avatar,
      name: selfIdentity.name,
      color: selfIdentity.color,
      clientId: clientId
    });
  }

  addon.port.on("init", updateSelf);

  updateSelf();

  addon.port.emit("ready");

  renderUsers();
  renderActivity();
  renderChatField();

}

var docReady = false;

$(function () {
  docReady = true;
  if (groupId) {
    init();
  }
});
