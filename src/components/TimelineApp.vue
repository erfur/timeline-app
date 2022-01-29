<template>
  <div id="timeline-app">
      <div id="timeline-view">
          <ol ref="timelineList">
              <li v-for="mark in storage.currentTimeline.markArr" 
                  :class="mark.type"
                  :key="mark.id"
                  @click="selectMark(mark, $event)">
                  <div>{{ mark }}</div>
                  <ol class="timeline-tags">
                      <li v-for="tag in mark.tags"
                          :key="tag.id">
                          {{ tag }}
                      </li>
                  </ol>
              </li>
          </ol>
          <div id="timeline-line" ref="timelineLine"></div>
      </div>
      <div id="timeline-nav">
          <a @click="toggleVisible" id="timeline-date">{{ storage.currentTimeline.date }}</a>
          <a v-show="buttonsVisible" @click="newTimeline">New</a>
          <a @click="addMark">Mark</a>
          <a v-show="buttonsVisible" @click="saveHistory">Save</a>
          <a v-show="buttonsVisible" @click="clearHistory">Clear</a>
          <a v-show="buttonsVisible" @click="exportFile">Export</a>
          <input v-show="buttonsVisible" v-model="currentTag" placeholder="Tag" v-on:keyup.enter="addTag"/>
          <a v-show="buttonsVisible" @click="addTag">Add Tag</a>
      </div>
  </div>
</template>

<script>
import { TimelineStorage, exportFile } from './timeline.js'

/* https://cordova.apache.org/docs/en/10.x/reference/cordova-plugin-file/#persistent
 */
function writeFile(fileEntry, dataObj) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            console.log("Successful file write...");
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };

        // If data object is not passed in,
        // create a new Blob instead.
        if (!dataObj) {
            dataObj = new Blob(["Content if there's nothing!"], { type: 'text/plain' });
        }

        fileWriter.write(dataObj);
    });
}

function createPersistentFile(fileDir, fileName, fileContent) {
    window.resolveLocalFileSystemURL(window.cordova.file.externalRootDirectory, function (rootDirEntry) {
            rootDirEntry.getDirectory(fileDir, { create: true }, function (dirEntry) {
                var isAppend = true;
                dirEntry.getFile(fileName, { create: true }, function (fileEntry) {
                    writeFile(fileEntry, fileContent, isAppend);
                });
            });
        });
}

export default {
  name: 'TimelineApp',

  data: function (){
    return {
      storage: new TimelineStorage(),
      currentTag: '',
      buttonsVisible: false,
    }
  },
  methods: {
    addMark: function () {
      this.storage.currentTimeline.addMark();
    },
    saveHistory: function () {
      this.storage.saveHistory();
    },
    clearHistory: function () {
      this.storage.clearHistory();
    },
    newTimeline: function () {
      this.storage.newTimeline();
    },
    exportFile: function () {
        if (window.device.platform === 'Android') {
            createPersistentFile('Download',
                `export-${this.storage.currentTimeline.date.toString()}.json`,
                this.storage.exportJSON())
        } else {
            exportFile(this.storage.exportJSON(), this.storage.currentTimeline.date.toString())
        }
    },
    selectMark: function(mark, event) {
      this.activeMark = mark;
      if (this.activeElement) {
        this.removeClass(this.activeElement, 'active');
      }
      this.activeElement = event.target;
      this.addClass(this.activeElement, 'active');
    },
    addClass: function(el, cname) {
      el.classList.add(cname);
    },
    removeClass: function(el, cname) {
      el.classList.remove(cname);
    },
    addTag: function() {
      if (this.currentTag) {
        this.activeMark.addTag(this.currentTag);
      }
    },
    updateLine() {
      if (this.$refs.timelineList.clientHeight) {
        this.$refs.timelineLine.style.top = `${this.$refs.timelineList.offsetTop + 10}px`
        this.$refs.timelineLine.style.height = `${this.$refs.timelineList.clientHeight - 20}px`;
      } else {
          this.$refs.timelineLine.style.height = '0px';
      }
    },
    toggleVisible: function() {
      if (this.buttonsVisible) {
          this.buttonsVisible = false;
      } else {
          this.buttonsVisible = true;
      } 
    },
  },
  updated() {
    this.updateLine();
  },
  mounted() {
    this.updateLine();

    // triggered when the app is put into background
    document.addEventListener("pause", () => this.saveHistory(), false);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.TimePoint {
    position: relative;
    display: block;

    background-color: #fff1e1;
    color : #1d3c45;
    border : 2px solid #1d3c45;
    border-radius: 20px;
    box-shadow: 0 0 4px #1d3c45;

    font-size : 24px;
    text-align : center;
    text-decoration : none;
    font-family : Arial, Helvetica, sans-serif;
    font-weight: bold;

    padding: 10px 10px;
    width : 60px;
    z-index: 3;
}

.TimeSpan {
    position: relative;
    display : block;

    background-color : #fff1e1;
    color : #1d3c45;
    border : 2px solid #1d3c45;
    box-shadow: 0 0 4px #1d3c45;

    font-size : 24px;
    text-align : center;
    text-decoration : none;
    font-family : Arial, Helvetica, sans-serif;

    padding : 15px;
    margin-left: 40px;
    margin-right: 10%;
    z-index: 3;
}

#timeline-line {
    content: "";
    width: 20px;
    left: 75px;
    background: #1d3c45;
    z-index: 1;
    box-shadow: 0 0 5px black;
    position: absolute;
}

#timeline-view .active {
    background-color: #1d3c45;
    color: #fff1e1;
}

#timeline-view {
    margin-bottom: 90%;
    position: sticky;
}

.TimeSpan *, .TimePoint {
    pointer-events: none;
}

#timeline-nav {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}

#timeline-nav * {
    background-color : #fff1e1;
    color : #1d3c45;
    border : 1px solid #1d3c45;
    display : block;
    font-size : 24px;
    text-align : center;
    text-decoration : none;
    padding : 15px;
    height: 30px;
    font-family : Arial, Helvetica, sans-serif;
    cursor : pointer;
    user-select : none;
    box-shadow: 0 0 4px #1d3c45;
    margin-left: auto;
    margin-right: auto;
    width: 90%;
}

.timeline-tags {
    list-style-type: none;
    margin: 0;
    padding: 0;
}

#timeline-nav a:focus {
    background-color: #1d3c45;
    color: #fff1e1;
}

</style>
