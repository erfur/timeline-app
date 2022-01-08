// logic ======================================================================

function TimePoint(id = 0, wakeupTime = false, sleepTime = true) {
  var id = id;
  var date = new Date();
  this.type = 'TimePoint';

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

TimePoint.prototype.toString = function () {
  return `${this.getHours().toString().padStart(2, '0')}`
          + `:${this.getMinutes().toString().padStart(2, '0')}`
}

function TimeSpan(id = 0, start, end) {
  var startPoint = start;
  var endPoint = end;
  this.type = 'TimeSpan';

  this.getStartPoint = () => startPoint;
  this.getEndPoint = () => endPoint;
  this.getDelta = () => endPoint - startPoint;
};

TimeSpan.prototype.toString = function () {
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

  this.addMark = function () {

    var m = new TimePoint(this.getId());

    // First mark is the wakeup time
    if (this.isFirstMark()) {
      m.setWakeupTime(true);
      markArr.push(m);
      return;
    }

    var pm = this.getLastPoint();
    var s = new TimeSpan(this.getId(), pm, m);

    markArr.push(s);
    markArr.push(m);
  };
}

Timeline.prototype.toString = function () {
  return `${this.getArr()}`;
}

// UI =========================================================================

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

function TimePointElem(time) {
  let elem = document.createElement(`timeline-timepoint`);
  elem.innerHTML = time.toString();
  elem.style.display = "block";

  return elem;
}

function TimeSpanElem(span) {
  let elem = document.createElement('timeline-timespan');
  elem.innerHTML = span.toString();
  elem.style.display = "block";

  return elem;
}

// main =======================================================================

timelineApp = function () {

  function markTime(){
    currTimeline.addMark();
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  };

  function clearHistory() {
    // console.log(timelineHist);
    timelineHist = [];
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  };

  function updateScreen() {
    appElem.textContent = "Test: " + JSON.stringify(timelineHist);

    appElem.appendChild(markButton);
    appElem.appendChild(clearButton);
    decorateMainElement();
  };

  function decorateMainElement() {
    for (var mark of currTimeline.getArr()) {
      if (mark.type === 'TimePoint') {
        appElem.appendChild(new TimePointElem(mark));
      } else if (mark.type === 'TimeSpan') {
        appElem.appendChild(new TimeSpanElem(mark));
      }
    }
  }

  // init code
  if (window.localStorage.getItem('th') === null) {
    window.localStorage.setItem('th', JSON.stringify([]));
    console.log("No th found, creating one now...");
  }

  let timelineHist = JSON.parse(window.localStorage.getItem('th'));
  timelineHist.push(new Timeline());
  let currTimeline = timelineHist.at(-1);

  const markButton = new TimelineButton("Mark", markTime);
  const clearButton = new TimelineButton("Clear", clearHistory);

  let appElem = document.getElementsByTagName("timeline-app")[0];
  updateScreen();
  // end init
}();
