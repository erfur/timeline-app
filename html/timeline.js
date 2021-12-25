function MarkPoint(id = 0, wakeupTime = false, sleepTime = true) {
  var id = id;
  var date = new Date();

  this.getHours = () => date.getHours();
  this.getMinutes =  () => date.getMinutes();

  var wakeupTime = wakeupTime;
  var sleepTime = sleepTime;

  this.setWakeupTime = (b) => wakeupTime = b;
  this.setSleepTime = (b) => sleepTime = b;

  this.equal = x => {
    x.getHours() === this.getHours()
      && x.getMinutes() === this.getMinutes();
  };
};

MarkPoint.prototype.toString = function () {
  return `${this.getHours()}:${this.getMinutes()}`;
}

function MarkSpan(id = 0, start, end) {
  var startPoint = start;
  var endPoint = end;

  this.getStartPoint = () => startPoint;
  this.getEndPoint = () => endPoint;
  this.getDelta = () => endPoint - startPoint;
};

MarkSpan.prototype.toString = function () {
  return `${this.getStartPoint()}-${this.getEndPoint()}`;
}

function Timeline() {
  var markArr = [];
  this.isFirstMark = () => markArr.length == 0;

  this.getArr = () => markArr;
  this.getLastPoint = () => markArr.at(-1);

  var currId = 0;
  this.getId = function () {
    return (currId += 1);
  }

  this.addMark = function (mark) {

    var m = new MarkPoint(this.getId());

    // First mark is the wakeup time
    if (this.isFirstMark()) {
      m.setWakeupTime(true);
      markArr.push(m);
      return;
    }

    var pm = this.getLastPoint();
    var s = new MarkSpan(this.getId(), m, pm);

    markArr.push(s);
    markArr.push(m);
  };
}

Timeline.prototype.toString = function () {
  return `${this.getArr()}`;
}

function TimelineButton(name, fcn) {
  this.elem = document.createElement(`timeline-button-${name}`);
  this.elem.innerHTML = name;
  this.elem.style.backgroundColor = "#4CAF50";
  this.elem.style.color = "white";
  this.elem.style.border = "2px solid green";
  this.elem.style.display = "block";
  this.elem.style.fontSize = "24px";
  this.elem.style.textAlign = "center";
  this.elem.style.textDecoration = "none";
  this.elem.style.padding = "15px 32px";
  this.elem.style.borderRadius = "12px";
  this.elem.style.width = "200px";
  this.elem.style.fontFamily = "Arial, Helvetica, sans-serif"
  this.elem.style.cursor = "pointer";
  this.elem.style.userSelect = "none";

  this.elem.onclick = fcn;

  return this.elem;
}

timelineApp = function () {

  function markFcn(){
    timelineHist.push(new Timeline());
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    update();
  };

  function clearFcn() {
    console.log(timelineHist);
    timelineHist = [];
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    update();
  };

  function update() {
    appElem.textContent = "Test: " + JSON.stringify(timelineHist);
    appElem.appendChild(markButton);
    appElem.appendChild(clearButton);
  };

  // init code
  if (window.localStorage.getItem('th') === null) {
    window.localStorage.setItem('th', JSON.stringify([]));
    console.log("No th found, creating one now...");
  }

  let timelineHist = JSON.parse(window.localStorage.getItem('th'));

  const markButton = new TimelineButton("Mark", markFcn);
  const clearButton = new TimelineButton("Clear", clearFcn);

  let appElem = document.getElementsByTagName("timeline-app")[0];
  update();
  // end init
}();
