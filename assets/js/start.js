let stateObj = { id: "1" };
window.history.replaceState(stateObj, "Page", "/stage/1/check");
setTimeout(function () {
  var myDiv = document.getElementById("root");
  myDiv.innerText = "Verifying";
  let stateObj = { id: "2" };
  window.history.replaceState(stateObj, "Page", "/stage/2/verify");
}, 2000);
setTimeout(function () {
  var myDiv = document.getElementById("root");
  myDiv.innerText = "Redirecting";
  let stateObj = { id: "3" };
  window.history.replaceState(stateObj, "Page", "/stage/3/redirect");
}, 4000);
