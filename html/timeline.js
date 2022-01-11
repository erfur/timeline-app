// logic ======================================================================

class TimePoint {

  type = 'TimePoint';
  date = new Date();
  wakeupTime = false;
  sleepTime = false;

  get hours() {
    return this.date.getHours();
  }

  get minutes() {
    return this.date.getMinutes();
  }

  get epoch() {
    return Math.trunc(this.date.getTime() / 1000);
  }

  isEqual(x) {
    x.getHours() === this.getHours()
      && x.getMinutes() === this.getMinutes();
  }

  toString() {
    return `${this.hours.toString().padStart(2, '0')}`
            + `:${this.minutes.toString().padStart(2, '0')}`;
  }
};

class TimeSpan {

  type = 'TimeSpan';

  constructor(id = 0, start, end) {
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

class Timeline {

  markArr = [];
  currid = 0;

  get isFirstMark() {
    return this.markArr.length == 0;
  }

  get lastPoint() {
    return this.markArr.at(-1);
  }

  newId() {
    this.currId += 1;
    return this.currId;
  }

  addMark(sleepTime=false) {

    var m = new TimePoint(this.newId());

    // First mark is the wakeup time
    if (this.isFirstMark) {
      m.wakeupTime = true;
      this.markArr.push(m);
      return;
    }

    if (sleepTime) {
      m.sleepTime = true;
    }

    var pm = this.lastPoint;
    var s = new TimeSpan(this.newId(), pm, m);

    this.markArr.push(s);
    this.markArr.push(m);
  }

  toString() {
    return `${this.markArr}`;
  }
};

// UI =========================================================================

function TimelineButton(name, fcn) {
  this.elem = document.createElement('timeline-button');
  this.elem.innerHTML = name;
  this.elem.className = name;
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
  let card = document.createElement('card');
  let line = document.createElement('line');
  let isButtonsActive = false;

  // fill the span with temp content
  card.innerHTML = `${span.delta.toString()} secs`;

  // set heights based on time difference
  // the value is temporarily exaggerated for testing
  card.style.height = `${30 + 10*span.delta}px`;
  line.style.height = `${100 + 10*span.delta}px`;

  card.onclick = function() {
    if (isButtonsActive === false) {
      let addTagButton = new TimelineButton('addTag', function (){});
      elem.appendChild(addTagButton);
      isButtonsActive = true;
    } else {
      elem.removeChild(elem.lastElementChild);
      isButtonsActive = false;
    }
  }

  // add the line to the span as a child
  elem.appendChild(line);
  elem.appendChild(card);
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
    timelineHist = [];
    currTimeline = new Timeline();
    window.localStorage.setItem('th', JSON.stringify(timelineHist));
    updateScreen();
  };

  function updateScreen() {
    appElem.textContent = "";

    appElem.appendChild(markButton);
    appElem.appendChild(endButton);
    appElem.appendChild(clearButton);
    decorateMainElement();
  };

  function decorateMainElement() {
    for (var mark of currTimeline.markArr) {
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
