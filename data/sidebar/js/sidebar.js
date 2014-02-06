var groupId;
var selfIdentity;
var clientId;
var INVITE_BASE;

var hub = mixinEvents({});

addon.port.on("init", function (initData) {
  groupId = initData.groupId;
  selfIdentity = initData.selfIdentity;
  clientId = initData.selfIdentity.clientId;
  if (initData.INVITE_BASE) {
    INVITE_BASE = initData.INVITE_BASE;
  }
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

  function send(msg) {
    addon.port.emit("send", msg);
  }

  var inviteUrl = INVITE_BASE + groupId;
  $("#hotdish-invite").val(inviteUrl);
  $("#hotdish-invite").change(function () {
    $("#hotdish-invite").val(inviteUrl);
  });
  $("#hotdish-invite-copy").click(function () {
    addon.port.emit("copyToClipboard", inviteUrl);
    $("#hotdish-invite-copy").text("Copied!");
    setTimeout(function () {
      $("#hotdish-invite-copy").text("Copy");
    }, 1000);
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
