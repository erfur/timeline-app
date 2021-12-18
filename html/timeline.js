function markObj(id = 0, sleepTime = true, wakeupTime = false) {
  return {
    id: id,
    hours: new Date().getHours(),
    minutes: new Date().getMinutes(),
    wakeupTime: wakeupTime,
    sleepTime: sleepTime,
    equal: function (x) {
      return (x.hours === this.hours && x.minutes === this.minutes);
    }
  }
};

function markCurrentTime() {
  var mark = new markObj(id = timeLineApp.markList.length);

  if (timeLineApp.markList.length == 0) {
    mark.wakeupTime = true;
    timeLineApp.markList.push({ text: mark });
    return;
  };

  if (timeLineApp.markList.at(-1).text.equal(mark)) {
    return;
  };

  timeLineApp.markList.at(-1).text.sleepTime = false;
  timeLineApp.markList.push({ text: mark })
};

document.body.innerText = "Test: " + JSON.stringify(markObj());