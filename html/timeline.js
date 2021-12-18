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

function TimelineApp() {

  if (window.localStorage.getItem('th') === null) {
    window.localStorage.setItem('th', JSON.stringify([]));
    console.log("No th found, creating one now...");
  }

  var timelineHist = JSON.parse(window.localStorage.getItem('th'));

  this.getHist = () => timelineHist;
  this.addHist = (x) => timelineHist.push(x);

  let btn = document.createElement("timeline-button");

  btn.innerHTML = "mark";
  btn.style.height = "50px";
  btn.style.width = "50px";
  btn.style.background = "grey";

  btn.onclick = function () {
    timelineHist.push(new Timeline());
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
  }

  var appElem = document.createElement("timeline-app");
  appElem.textContent = "Test: " + JSON.stringify(timelineHist);
  document.body.appendChild(appElem);

  var ta = document.getElementsByTagName("timeline-app")
  console.log(`ta len: ${ta.length}`);
  for (i=0; i<ta.length; i++) {
    ta[i].appendChild(btn);
  }

  // var currTimeline = new Timeline();

  // timelineHist.push(currTimeline);
  // currTimeline.addMark();
  // currTimeline.addMark();

}

var t = new TimelineApp();
