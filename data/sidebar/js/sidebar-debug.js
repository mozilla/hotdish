var groupId;
var selfIdentity;
var clientId;

if (location.href.search(/debug/) != -1) {
  turnOnDebug();
}

function turnOnDebug() {

  var match = /groupId=([^&]*)/.exec(location.href);
  groupId = match[1];
  clientId = "testself";
  selfIdentity = {
    name: "Test Self",
    clientId: clientId,
    color: "#f00",
    avatar: null
  };
  addon = {
    _ons: {},
    port: {
      on: function (type, handler) {
        if (! addon._ons[type]) {
          addon._ons[type] = [];
        }
        addon._ons[type].push(handler);
      },
      emit: function (type) {
        console.log.apply(console, ["EMIT"].concat(Array.prototype.slice.call(arguments)));
      },
      localEmit: function (type) {
        var args = Array.prototype.slice.call(arguments, 1);
        var ons = addon._ons[type] || [];
        ons.forEach(function (handler) {
          handler.apply(null, args);
        });
      }
    }
  };

  var fakers = 0;

  function debugSend(msg) {
    if (! msg.clientId) {
      msg.clientId = "faker" + fakers;
    }
    console.log("Internal send:", msg);
    addon.port.localEmit("message", msg);
  }

  $(function () {
    document.documentElement.classList.add("debug-html");
    document.body.classList.add("debug");
    var iframeSrc = "./listener.html?groupId=" + groupId;
    var iframe = $("<iframe>").attr("src", iframeSrc).attr("id", "debug-listener");
    $("#debug-panel").append($("<div>").append(iframe));

    var addTabIndex = 0;
    $("#add-tab").click(function () {
      var local = $("#add-tab-local").prop("checked");
      var msgId = local ? clientId : ("faker"+fakers);
      var tabId = parseInt($("#add-tab-tabid").val(), 10);
      addTabIndex++;
      debugSend({
        type: "pageshow",
        clientId: msgId,
        tab: {
          id: msgId + "-" + tabId,
          index: addTabIndex,
          pinned: false,
          title: "Some Page " + tabId,
          url: $("#add-tab-url").val(),
          favicon: null
        }
      });
      var newUrl = DEBUG_URLS[Math.floor(Math.random() * DEBUG_URLS.length)];
      $("#add-tab-url").val(newUrl);
      $("#add-tab-tabid").val(parseInt($("#add-tab-tabid").val(), 10) + 11);
    });

    $("#add-person").click(function () {
      fakers++;
      var name = $("#add-person-name").val();
      var avatar = AVATARS[name];
      var nameIndex = DEBUG_NAMES.indexOf(name);
      if (nameIndex >= DEBUG_NAMES.length) {
        nameIndex = 0;
      }
      $("#add-person-name").val(DEBUG_NAMES[nameIndex+1]);
      addon.port.localEmit("peer", {
        name: name,
        avatar: avatar,
        color: "#" + fakers + "f" + fakers,
        clientId: "faker" + fakers
      }, true);
    });

    $("#debug-panel-container").append($("#debug"));

  });

  var DEBUG_URLS = [
    "http://google.com",
    "http://yahoo.com",
    "http://mozilla.org",
    "http://developer.mozilla.org"
  ];

  var DEBUG_NAMES = [
    "Ian Bicking",
    "Aaron Druck",
    "Gregg Lind",
    "Ilana Segall"
  ];

  var AVATARS = {
    "Gregg Lind": 'temp-images/avatar-1.jpg',
    "Ilana Segall": 'temp-images/avatar-2.jpg',
    "Ian Bicking": 'temp-images/avatar-3.jpg',
    "Aaron Druck": 'temp-images/avatar-4.jpg'
  };

}
