// logic ======================================================================

class TimePoint {
  constructor() {
    this.type = 'TimePoint';
    this.date = new Date();
    this.wakeupTime = false;
    this.sleepTime = false;
  }

  get hours() {
    return this.date.getHours();
  }

  get minutes() {
    return this.date.getMinutes();
  }

  get epoch() {
    return Math.trunc(this.date.getTime() / 1000);
  }

  equal(x) {
    x.getHours() === this.getHours()
      && x.getMinutes() === this.getMinutes();
  }

  toString() {
    return `${this.hours.toString().padStart(2, '0')}`
            + `:${this.minutes.toString().padStart(2, '0')}`;
  }
};

class TimeSpan {
  constructor(id = 0, start, end) {
    this.type = 'TimeSpan';
    this.id = id;
    this.startPoint = start;
    this.endPoint = end;
  }

  get delta() {
    return this.endPoint.epoch - this.startPoint.epoch;
  }

  toString() {
    return `${this.startPoint}-${this.endPoint}`;
  }
};

function Timeline() {
  var markArr = [];
  this.isFirstMark = () => markArr.length == 0;

  this.getArr = () => markArr;
  this.getLastPoint = () => markArr.at(-1);

  var currId = 0;
  this.getId = function () {
    return (currId += 1);
  }

  this.addMark = function (sleepTime=false) {

    var m = new TimePoint(this.getId());

    // First mark is the wakeup time
    if (this.isFirstMark()) {
      m.wakeupTime = true;
      markArr.push(m);
      return;
    }

    if (sleepTime) {
      m.sleepTime = true;
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
  this.elem = document.createElement('timeline-button');
  this.elem.innerHTML = name;
  this.elem.id = name;
  this.elem.onclick = fcn;

  return this.elem;
}

function TimePointElem(time) {
  let elem = document.createElement('timeline-timepoint');
  elem.innerHTML = time.toString();

  if (time.wakeupTime) {
    elem.className = "wakeup";
  } else if (time.sleepTime) {
    elem.className = "sleep";
  }

  return elem;
}

function TimeSpanElem(span) {
  // create span and the line
  let elem = document.createElement('timeline-timespan');
  let line = document.createElement('line');

  // fill the span with temp content
  elem.innerHTML = `${span.delta.toString()} secs`;

  // set heights based on time difference
  // the value is temporarily exaggerated for testing
  elem.style.height = `${30 + 10*span.delta}px`;
  line.style.height = `${100 + 10*span.delta}px`;

  // add the line to the span as a child
  elem.appendChild(line);
  return elem;
}

// main =======================================================================

timelineApp = function () {

  function markTime(){
    currTimeline.addMark();
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  };

  function endTime() {
    currTimeline.addMark(sleepTime=true);
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  }

  function clearHistory() {
    // console.log(timelineHist);
    timelineHist = [];
    currTimeline = new Timeline();
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  };

  function updateScreen() {
    // appElem.textContent = "Test: " + JSON.stringify(timelineHist);
    appElem.textContent = "";

    appElem.appendChild(markButton);
    appElem.appendChild(endButton);
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
  const endButton = new TimelineButton("End", endTime);
  const clearButton = new TimelineButton("Clear", clearHistory);

  let appElem = document.getElementsByTagName("timeline-app")[0];
  updateScreen();
  // end init
}();
