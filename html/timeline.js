// logic ======================================================================


class TimePoint {

  type = 'TimePoint';

  constructor(date = new Date()) {
    this.date = date;
  }

  get hours() {
    return this.date.getHours();
  }

  get minutes() {
    return this.date.getMinutes();
  }

  get epochMinutes() {
    return Math.trunc(this.date.getTime() / (1000 * 60));
  }

  get epoch() {
    return Math.trunc(this.date.getTime() / 1000);
  }

  toJSON() {
    return {
      $type: this.type,
      date: this.date.toString(),
    };
  }

  static fromJson(data) {
    return new TimePoint(new Date(data.date));
  }

};

class TimeSpan {

  type = 'TimeSpan';

  constructor(id = 0, start, end, tags = []) {
    this.id = id;
    this.startPoint = start;
    this.endPoint = end;
    this.tags = tags;
  }

  get delta() {
    return this.endPoint.epochMinutes - this.startPoint.epochMinutes;
  }

  addTag(t) {
    this.tags.push(t);
  }

  toJSON() {
    return {
      $type: 'TimeSpan',
      id: this.id,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      tags: this.tags,
    };
  }

  static fromJson(data) {
    return new TimeSpan(data.id, data.startPoint, data.endPoint, data.tags);
  }

};

class Timeline {
  constructor(markArr = [], currid = 0, date = new Date()) {
    this.creationDate = date;
    this.markArr = markArr;
    this.currid = currid;
  }

  get isFirstMark() {
    return this.markArr.length == 0;
  }

  get firstPoint() {
    return this.markArr.at(0);
  }

  get lastPoint() {
    return this.markArr.at(-1);
  }

  formatDate() {
    const t = new Date();
    const date = ("0" + t.getDate()).slice(-2);
    const month = ("0" + (t.getMonth() + 1)).slice(-2);
    const year = t.getFullYear();
    return `${date}/${month}/${year}`;
  }

  get date() {
    return this.formatDate(this.creationDate);
  }

  newId() {
    this.currId += 1;
    return this.currId;
  }

  addMark() {
    var m = new TimePoint(new Date(), this.newId());

    // First mark is the wakeup time
    if (this.isFirstMark) {
      this.markArr.push(m);
      return [m];
    }

    var pm = this.lastPoint;
    var s = new TimeSpan(this.newId(), pm, m);

    this.markArr.push(s);
    this.markArr.push(m);

    return [s, m];
  }

  toJSON() {
    return {
      $type: "Timeline",
      markArr: this.markArr,
      currid: this.currid,
      date: this.date,
    };
  }

  static fromJson(data) {
    return new Timeline(data.markArr, data.currid, data.date);
  }
};

class TimelineStorage {
  constructor() {
    // using only one timeline for development
    // this.timelineHistory = JSON.parse(window.localStorage.timelineHistory);
    // this.timelineHistory.push(new Timeline());
    // this.currentTimeline = this.timelineHistory.at(-1);

    this.timelineHistory = this.persistentHistory;
    this.currentTimeline = this.timelineHistory.at(-1);
  }

  set persistentHistory(hist) {
    window.localStorage.timelineHistory = JSON.stringify(hist);
  }

  get persistentHistory() {
    if (window.localStorage.timelineHistory === undefined) {
      this.clearHistory();
      this.saveHistory();
      return this.timelineHistory;
    }

    return JSON.parse(window.localStorage.timelineHistory, (k, v) => this.reviver(k, v));
  }

  reviver(_, value) {
    if (value && value.$type === 'Timeline') {
      return Timeline.fromJson(value);
    } else if (value && value.$type === 'TimePoint') {
      return TimePoint.fromJson(value);
    } else if (value && value.$type === 'TimeSpan') {
      return TimeSpan.fromJson(value);
    } else {
      return value;
    }
  }

  clearHistory() {
    this.timelineHistory = [];
    this.newTimeline();
  };

  saveHistory() {
    this.persistentHistory = this.timelineHistory;
  }

  exportJSON() {
    return JSON.stringify(this.timelineHistory);
  }

  newTimeline() {
    let timeline = new Timeline();
    this.timelineHistory.push(timeline);
    this.currentTimeline = timeline;
  }
}

// View Model ==================================================================

class TimelineButton {

  elem = document.createElement('timeline-button');

  constructor(name, fcn) {
    this.elem.innerHTML = name;
    this.elem.className = name;
    this.elem.onclick = fcn;
  }

  appendTo(dom) {
    dom.appendChild(this.elem);
  }

}

class TimePointElem {
  elem = document.createElement('timeline-timepoint');

  constructor(time) {
    this.elem.innerHTML = `${time.hours.toString().padStart(2, '0')}`
                          + `:${time.minutes.toString().padStart(2, '0')}`;
  }

  set wakeup(b) {
    if (b) {
      this.elem.className = "wakeup";
    } else {
      this.elem.className = '';
    }
  }

  set sleep(b) {
    if (b) {
      this.elem.className = "sleep";
    } else {
      this.elem.className = '';
    }
  }

  appendTo(dom) {
    dom.appendChild(this.elem);
  }
}

class TimeLineElem {

  elem = document.createElement('timeline-line');

  constructor(topCoord, bottomCoord) {
    this.top = topCoord;
    this.bottom = bottomCoord;
  }

  set top(pos) {
    this.topPos = window.pageYOffset + pos;
    this.elem.style.top = `${this.topPos}px`;
  }

  set bottom(pos) {
    this.bottomPos = window.pageYOffset + pos;
    this.elem.style.height = `${this.bottomPos - this.topPos}px`;
  }

  appendTo(dom) {
    dom.appendChild(this.elem);
  }
}

class TimeSpanElem {

  // create span and the line
  elem = document.createElement('timeline-timespan');
  card = document.createElement('card');
  line = document.createElement('line');
  isButtonsActive = false;

  // TODO refactor
  constructor(span, mainUpdate) {
    this.span = span;
    this.mainUpdate = mainUpdate;

    // init cardview
    this.update();

    // set heights based on time difference
    // the value is temporarily exaggerated for testing
    // card.style.height = `${30 + 10*span.delta}px`;
    this.card.style.marginBottom = `${span.delta/60}px`;
    this.line.style.height = `${100 + span.delta/60}px`;

    this.card.onclick = () => this.cardOnclick();

    // add the line to the span as a child
    this.elem.appendChild(this.card);
    this.elem.appendChild(this.line);
  }

  cardOnclick() {
    if (this.isButtonsActive === false) {
      let addTagButton = new TimelineButton('addTag', () => {
        var tag;
        if (tag = window.prompt('Enter tag: ')) {
          this.span.addTag(tag);
          this.update();
          this.mainUpdate();
        }
      });
      this.elem.appendChild(addTagButton.elem);
      this.isButtonsActive = true;
    } else {
      this.elem.removeChild(this.elem.lastElementChild);
      this.isButtonsActive = false;
    }
  }

  update() {
    // fill the span with temp content
    this.card.innerHTML = `<p>${this.span.delta} mins</p>`
      + this.span.tags.map((t) => `<p>${t}</p>`).join("");
  }

  appendTo(dom) {
    dom.appendChild(this.elem);
  }
}

class TimeLineView {
  constructor(mainView) {
    this.mainView = mainView;
    this.timeLine = new TimeLineElem();
    this.timeLine.appendTo(mainView.mainElem);
  }

  update() {
    if (this.mainView.timeItemArray.length) {
      // TODO add api to simplify these
      var topPos = this.mainView.timeItemArray.at(0).view.elem.getBoundingClientRect().bottom;
      var bottomPos = this.mainView.timeItemArray.at(-1).view.elem.getBoundingClientRect().top;

      console.log(topPos);
      console.log(bottomPos);

      this.timeLine.top = topPos;
      this.timeLine.bottom = bottomPos;
    }
  }
}

class TimelineMainView {
  timeItemArray = [];

  constructor(storage, mainElem) {
    this.storage = storage;
    this.mainElem = mainElem;

    this.timeLineView = new TimeLineView(this);
    this.initView();
  }

  initView() {
    var item;

    for (var elem of this.storage.currentTimeline.markArr) {
      if (elem.type === 'TimePoint') {
        item = this.addTimePoint(elem);
      } else if (elem.type === 'TimeSpan') {
        item = this.addTimeSpan(elem);
      }
    }

    this.timeLineView.update();
  }

  addMark() {
    var newData = this.storage.currentTimeline.addMark();
    for (var data of newData) {
      if (data.type === 'TimePoint') {
        this.addTimePoint(data);
      } else if (data.type === 'TimeSpan') {
        this.addTimeSpan(data);
      }
    }

    this.timeLineView.update();
  }

  addTimePoint(point) {
    var item = {
      data: point,
      view: new TimePointElem(point)
    };
    this.timeItemArray.push(item);
    item.view.appendTo(this.mainElem);
    return item;
  }

  addTimeSpan(span) {
    var item = {
      data: span,
      view: new TimeSpanElem(span, () => this.timeLineView.update())
    };
    this.timeItemArray.push(item);
    item.view.appendTo(this.mainElem);
    return item;
  }
}

class TimelineButtonView {
  // TODO
}

class TimelineAppView {
  constructor(storage) {
    this.storage = storage;
    this.appElem = document.getElementsByTagName("timeline-app")[0];
    this.buttonsElem = document.createElement('timeline-buttons');
    this.mainElem = document.createElement('timeline-main');

    this.appElem.appendChild(this.buttonsElem);
    this.appElem.appendChild(this.mainElem);

    this.viewElements = new Object();

    // TODO
    // this.buttonView = new TimelineButtonView(this.storage, this.appElem);
    this.initButtons();

    this.mainView = new TimelineMainView(this.storage, this.mainElem);
  }

  initButtons() {
    // no need to use dict for these buttons
    this.viewElements.mainButtons = [];

    this.viewElements.mainButtons.
    push(new TimelineButton(this.storage.currentTimeline.date, function (){}));
    this.viewElements.mainButtons.push(new TimelineButton("New", () => this.storage.newTimeline()));
    this.viewElements.mainButtons.push(new TimelineButton("Mark", () => this.mainView.addMark()));
    this.viewElements.mainButtons.push(new TimelineButton("Clear", () => this.storage.clearHistory()));
    this.viewElements.mainButtons.push(new TimelineButton("Save", () => this.storage.saveHistory()));
    this.viewElements.mainButtons.push(new TimelineButton("Export", () => this.exportFile()));

    // this access is tricky in js
    for (var button of this.viewElements.mainButtons) {
      button.appendTo(this.buttonsElem);
    }
  }

  exportFile() {
    let content = "data:application/json;charset=utf-8," + this.storage.exportJSON();

    let exportFileDefaultName = 'timeline-export.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', encodeURI(content));
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  }

}

// main =======================================================================

class TimelineApp {
  storage = new TimelineStorage()
  viewModel = new TimelineAppView(this.storage);
}

const timelineApp = new TimelineApp();
