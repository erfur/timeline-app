<template>
  <TimelineApp/>
</template>

<script>
import TimelineApp from './components/TimelineApp.vue'

export default {
  name: 'App',
  components: {
    TimelineApp
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  background-color: lightgrey;
}
</style>
