// logic ======================================================================

/**
 * Represents a point in time.
 */
class TimePoint {

  type = 'TimePoint';

  /**
   * Create a TimePoint.
   * @constructor
   * @param {Date} date - Value of the date.
   */
  constructor(date = new Date()) {
    this.date = date;
  }

  /**
   * Hour value of the point.
   * @type {number}
   */
  get hours() {
    return this.date.getHours();
  }

  /**
   * Minute value of the point.
   * @type {number}
   */
  get minutes() {
    return this.date.getMinutes();
  }

  /**
   * Minutes passed since epoch.
   * @type {number}
   */
  get epochMinutes() {
    return Math.trunc(this.date.getTime() / (1000 * 60));
  }

  /**
   * Seconds passed since epoch.
   * @type {number}
   */
  get epoch() {
    return Math.trunc(this.date.getTime() / 1000);
  }

  /**
   * Serialize as json.
   * @return {this}
   */
  toJSON() {
    return {
      $type: this.type,
      date: this.date.toString(),
    };
  }

  /**
   * Helper method to deserialize from json.
   * @return {TimelinePoint}
   */
  static fromJson(data) {
    return new TimePoint(new Date(data.date));
  }

  toString() {
    return `${this.date.getHours().toString()}:${this.date.getMinutes().toString()}`
  }
};

/**
 * Represents the span between two time points.
 */
class TimeSpan {

  type = 'TimeSpan';

  /**
   * Create a TimeSpan.
   * @constructor
   * @param {TimePoint} start - Head of the timespan.
   * @param {TimePoint} end - Tail of the timespan.
   * @param {String[]} tags - Tags of the timespan.
   */
  constructor(start, end, tags = []) {
    this.startPoint = start;
    this.endPoint = end;
    this.tags = tags;
  }

  /**
   * Get the difference between starting and ending time points in terms of
   * minutes.
   * @return {number}
   */
  get delta() {
    return this.endPoint.epochMinutes - this.startPoint.epochMinutes;
  }

  /**
   * Add a tag to this timespan.
   * @param {string} t - String value of the tag.
   */
  addTag(t) {
    this.tags.push(t);
  }

  /**
   * Helper function to serialize this object to json.
   * @return {this}
   */
  toJSON() {
    return {
      $type: 'TimeSpan',
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      tags: this.tags,
    };
  }

  /**
   * Helper method to deserialize.
   * @return {TimeSpan}
   */
  static fromJson(data) {
    return new TimeSpan(data.startPoint, data.endPoint, data.tags);
  }

  toString() {
    return `${this.delta} mins`
  }

};

/**
 * Represents a timeline that starts and ends with timepoints.
 */
class Timeline {

  /**
   * Create a timeline.
   * @param {array} marArr - Array of TimePoint and TimeSpans.
   * @param {Date} date - The date and time of creation.
   */
  constructor(markArr = [], date = new Date()) {
    this.markArr = markArr;
    this.creationDate = date;
  }

  /**
   * Check if the current timeline is empty.
   * @return {bool}
   */
  get isEmpty() {
    return this.markArr.length == 0;
  }

  /**
   * Fetch the first timepoint in the timeline.
   * @return {TimePoint}
   */
  get firstPoint() {
    return this.markArr.at(0);
  }

  /**
   * Fetch the last timepoint in the timeline.
   * @return {TimePoint}
   */
  get lastPoint() {
    return this.markArr.at(-1);
  }

  /**
   * Return the creation date in DD/MM/YYYY format.
   * @return {string}
   */
  get date() {
    let t = this.creationDate;
    const date = ("0" + t.getDate()).slice(-2);
    const month = ("0" + (t.getMonth() + 1)).slice(-2);
    const year = t.getFullYear();
    return `${date}-${month}-${year}`;
  }

  /**
   * Add a new timepoint (and a timespan if necessary).
   * @return {mark[]}
   */
  addMark() {
    var currentMark = new TimePoint(new Date());

    if (this.isEmpty) {
      this.markArr.push(currentMark);
      return [currentMark];
    }

    var previousMark = this.lastPoint;
    var span = new TimeSpan(previousMark, currentMark);

    this.markArr.push(span);
    this.markArr.push(currentMark);

    return [span, currentMark];
  }

  /**
   * Helper function to serialize this object to json.
   * @return {this}
   */
  toJSON() {
    return {
      $type: "Timeline",
      markArr: this.markArr,
      date: this.date,
    };
  }

  /**
   * Helper method to deserialize.
   * @return {Timeline}
   */
  static fromJson(data) {
    return new Timeline(data.markArr, data.currid, data.date);
  }
};

/**
 * Handler of Timelines.
 */
class TimelineStorage {

  /**
   * Create a new TimelineStorage.
   */
  constructor() {
    this.timelineHistory = this.persistentHistory;
    this.currentTimeline = this.timelineHistory.at(-1);
  }

  /**
   * Save the given history to browser local storage.
   * @param {Timeline[]} hist - List of Timelines.
   */
  set persistentHistory(hist) {
    window.localStorage.timelineHistory = JSON.stringify(hist);
  }

  /**
   * Fetch timeline history from browser local storage. A new timeline is
   * initialized if one doesn't exist.
   * @return {Timeline[]}
   */
  get persistentHistory() {
    if (window.localStorage.timelineHistory === undefined) {
      this.clearHistory();
      this.saveHistory();
      return this.timelineHistory;
    }

    return JSON.parse(window.localStorage.timelineHistory, (k, v) => this.reviver(k, v));
  }

  /**
   * Helper method for deserializing timeline history from string.
   */
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

  /**
   * Clear the current timeline history and initialize a new timeline.
   */
  clearHistory() {
    this.timelineHistory = [];
    this.newTimeline();
  };

  /**
   * Save the current timeline history to browser local storage.
   */
  saveHistory() {
    this.persistentHistory = this.timelineHistory;
  }

  /**
   * Export current timeline history as json.
   * @return {string}
   */
  exportJSON() {
    return JSON.stringify(this.timelineHistory);
  }

  /**
   * Create a new timeline.
   */
  newTimeline() {
    let timeline = new Timeline();
    this.timelineHistory.push(timeline);
    this.currentTimeline = timeline;
  }
}

// View Model ==================================================================

/**
 * Represents a button.
 */
class TimelineButton {

  /**
   * The main DOM element of this button.
   */
  elem = document.createElement('timeline-button');

  /**
   * Create a new button.
   * @param {TimelineButtonView} parentView
   * @param {string} name - The visible & class name of the button.
   * @param {function} fcn - Function to execute when the button is clicked.
   */
  constructor(parentView, name, fcn) {
    this.buttonView = parentView;
    this.elem.innerHTML = name;
    this.elem.className = name;
    this.elem.onclick = fcn;

    this.buttonView.elem.appendChild(this.elem);
  }
}

/**
 * Represents a TimePoint element.
 */
class TimePointElem {

  /**
   * The main DOM element.
   */
  elem = document.createElement('timeline-timepoint');

  /**
   * Create a new TimePointElem.
   * @param {TimelineMainView} parentView
   * @param {TimePoint} time - TimePoint that the element will visualize.
   */
  constructor(parentView, time) {
    this.elem.innerHTML = `${time.hours.toString().padStart(2, '0')}`
                          + `:${time.minutes.toString().padStart(2, '0')}`;

    parentView.elem.appendChild(this.elem);
  }
}

class TimeLineView {

  /**
   * The main DOM element..
   */
  elem = document.createElement('timeline-line');

  /**
   * Create a new TimeLineElem.
   * @param {TimelineMainView} parentView - The mainview element.
   * @param {number} topCoord - Top coordinate of the visual line.
   * @param {number} bottomCoord - Bottom coordinate of the visual line.
   */
  constructor(parentView, topCoord, bottomCoord) {
    this.mainView = parentView;
    this.top = topCoord;
    this.bottom = bottomCoord;

    this.mainView.elem.appendChild(this.elem);
  }

  /**
   * Setter for the top coordinate. The style is updated with the given value.
   * @param {number} pos
   */
  set top(pos) {
    this.topPos = window.pageYOffset + pos;
    this.elem.style.top = `${this.topPos}px`;
  }

  /**
   * Setter for the bottom coordinate. This value is used to set the height of
   * the element.
   * @param {number} pos
   */
  set bottom(pos) {
    this.bottomPos = window.pageYOffset + pos;
    this.elem.style.height = `${this.bottomPos - this.topPos}px`;
  }

  /**
   * Update the coordinates based on the first and the last timepoints.
   */
  update() {
    if (this.mainView.timeItemArray.length) {
      // TODO add api to simplify these
      var topPos = this.mainView.timeItemArray.at(0).view.elem.getBoundingClientRect().bottom;
      var bottomPos = this.mainView.timeItemArray.at(-1).view.elem.getBoundingClientRect().top;

      this.top = topPos;
      this.bottom = bottomPos;
    }
  }
}

/**
 * Represents a TimeSpan view.
 */
class TimeSpanElem {

  /**
   * The main DOM element..
   */
  elem = document.createElement('timeline-timespan');

  /**
   * Card element. Child of the main element.
   */
  card = document.createElement('card');

  /**
   * Used to keep track of toggled buttons.
   */
  isButtonsActive = false;

  /**
   * Create a new TimeSpanElem.
   * @param {TimelineMainView} parentView
   * @param {TimeSpan} span - The underlying time span.
   * @param {Function} mainUpdate - The update function of the main view.
   */
  constructor(parentView, span, mainUpdate) {
    this.span = span;
    this.mainUpdate = mainUpdate;

    // init cardview
    this.update();

    // This is kinda useless, the card can be extended with additional tags
    // anyway, which in itself indicates that the timespan is longer.
    // this.card.style.marginBottom = `${span.delta}px`;

    // add the callback
    this.card.onclick = () => this.cardOnclick();

    // add the line to the span as a child
    this.elem.appendChild(this.card);

    parentView.elem.appendChild(this.elem);
  }

  /**
   * Callback method for card.onclick.
   */
  cardOnclick() {
    if (this.isButtonsActive === false) {
      let addTagButton = new TimelineButton(this, 'addTag', () => {
        var tag;
        if (tag = window.prompt('Enter tag: ')) {
          this.span.addTag(tag);
          this.update();
          this.mainUpdate();
        }
      });
      this.isButtonsActive = true;
    } else {
      // TODO this is not practical.
      this.elem.removeChild(this.elem.lastElementChild);
      this.isButtonsActive = false;
    }
  }

  /**
   * Update the content of the card.
   */
  update() {
    this.card.innerHTML = `<p>${this.span.delta} mins</p>`
      + this.span.tags.map((t) => `<p>${t}</p>`).join("");
  }

}

/**
 * Represents the main view (timepoints, timespans and cards) of timeline.
 */
class TimelineMainView {

  /**
   * Keeps the timeline elements.
   */
  timeItemArray = [];

  /**
   * Main element of this view.
   */
  elem = document.createElement('timeline-main');

  /**
   * Create a new TimelineMainView.
   * @param {TimelineAppView} parentView
   */
  constructor(parentView) {
    this.appView = parentView;
    this.storage = parentView.storage;

    this.appView.elem.appendChild(this.elem);
    this.timeLineView = new TimeLineView(this);
    this.initView();
  }

  /**
   * Generate views for the current timeline.
   */
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

  /**
   * Add a new mark (timepoint and/or timespan) to the current timeline.
   */
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

  /**
   * Add a new TimePoint to the current timeline.
   * @param {TimePoint} point - The data class of the time point.
   */
  addTimePoint(point) {
    var item = {
      data: point,
      view: new TimePointElem(this, point)
    };
    this.timeItemArray.push(item);
    return item;
  }

  /**
   * Add a new TimeSpan to the current timeline.
   * @param {TimeSpan} point - The data class of the time span.
   */
  addTimeSpan(span) {
    var item = {
      data: span,
      view: new TimeSpanElem(this, span, () => this.timeLineView.update())
    };
    this.timeItemArray.push(item);
    return item;
  }
}

/**
 * Represents a group of timeline buttons.
 */
class TimelineButtonView {

  /**
   * Main element of this view.
   */
  elem = document.createElement('timeline-buttons');

  /**
   * Array of buttons.
   */
  buttons = [];

  /**
   * Create a new timeline button view.
   * @param {TimelineAppView} parentView
   */
  constructor(parentView) {
    this.appView = parentView;
    this.storage = parentView.storage;
    this.mainView = parentView.mainView;

    this.appView.elem.insertBefore(this.elem, this.appView.elem.childNodes[0]);
    this.initButtons();
  }

  /**
   * Initialize the buttons.
   */
  initButtons() {
    this.buttons.push(new TimelineButton(this, this.storage.currentTimeline.date, function (){}));
    this.buttons.push(new TimelineButton(this, "New", () => this.storage.newTimeline()));
    this.buttons.push(new TimelineButton(this, "Mark", () => this.mainView.addMark()));
    this.buttons.push(new TimelineButton(this, "Clear", () => this.storage.clearHistory()));
    this.buttons.push(new TimelineButton(this, "Save", () => this.storage.saveHistory()));
    this.buttons.push(new TimelineButton(this, "Export", () => this.appView.exportFile()));
  }

}

/**
 * Represents a TimelineApp view.
 */
class TimelineAppView {

  elem = document.getElementsByTagName("timeline-app")[0];

  /**
   * Create a new TimelineAppView
   * @param {TimelineStorage} storage - The data storage for timeline app.
   */
  constructor(storage) {
    this.storage = storage;
    this.mainView = new TimelineMainView(this);
    this.buttonView = new TimelineButtonView(this);
  }

  /**
   * Export by triggering a download of the current timeline history as a json file.
   */
  exportFile() {
    let content = "data:application/json;charset=utf-8," + this.storage.exportJSON();

    let exportFileDefaultName = `timeline-export_${this.storage.currentTimeline.date}.json`;

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', encodeURI(content));
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  }

}

// main =======================================================================


// const TimelineMark = {
//   props: ['mark'],
//   template: `<li>{{ mark }}</li>`
// }

const TimelineApp = (function () {
  storage = new TimelineStorage();

  return {
    data() {
      return {
        // required for vue update triggers
        storage: storage,
        marks: storage.currentTimeline.markArr,
      }
    },
    methods: {
      addMark: function () {
        console.log('Clicked addMark');
        console.log(storage.currentTimeline.markArr);
        this.storage.currentTimeline.addMark();
        // this.marks.push(new TimePoint());
      }
    },
    // components: {
    //   TimelineMark,
    // },
    created() {
      console.log(`Count of current marks: ${storage.currentTimeline.markArr.length}`);
    },
    updated() {
      console.log(`Count of current marks: ${storage.currentTimeline.markArr.length}`);
    }
  };
})();

const vm = Vue.createApp(TimelineApp).mount('#timeline-app')
