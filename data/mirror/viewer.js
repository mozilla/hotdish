document.addEventListener("click", function (event) {
  var name = event.target.tagName;
  if (name == "A" || name == "BUTTON" ||
      (name == "INPUT" && event.target.getAttribute("type") == "submit")) {
    event.preventDefault();
    return false;
  }
}, true);

document.addEventListener("focus", function (event) {
  event.preventDefault();
}, true);

//If you're a spectator, your cursor should :not-allowed
$("body").css("cursor","not-allowed");

// spectator's cursor should be :not-allowed
$(".together-cursor").css("cursor","not-allowed");

var viewer = document.getElementById("viewer");
viewer.parentNode.removeChild(viewer);
