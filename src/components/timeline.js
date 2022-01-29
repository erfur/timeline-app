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
    let rjust = (t) => ("0" + t).slice(-2);
    return `${rjust(this.date.getHours().toString())}:${rjust(this.date.getMinutes().toString())}`
  }
}

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

}

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
}

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
  }

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
    this.timelineHistory.push(new Timeline());
    this.currentTimeline = this.timelineHistory.at(-1);
  }
}

function exportFile(json, fname) {
    let content = "data:application/json;charset=utf-8," + json;
    let exportFileDefaultName = `timeline-export_${fname}.json`;
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', encodeURI(content));
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
}

export { TimelineStorage, exportFile }
