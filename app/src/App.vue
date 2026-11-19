<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import type { DailySet } from "@wizzit/shared";
import WelcomeScreen from "./components/WelcomeScreen.vue";
import PlayScreen from "./components/PlayScreen.vue";
import ResultsScreen from "./components/ResultsScreen.vue";
import { fetchDailySet } from "./lib/daily.ts";
import { flushFlagQueue } from "./lib/flags.ts";
import { localDate } from "./lib/dates.ts";
import { currentStreak, getDay, requestPersistence, type DayRecord } from "./lib/storage.ts";

type Screen = "welcome" | "play" | "results";

const today = localDate();
const screen = ref<Screen>("welcome");
const set = shallowRef<DailySet | null>(null);
const loading = ref(true);
const record = ref<DayRecord | undefined>(getDay(today));
const streak = ref(currentStreak(today));

function refresh() {
  const r = getDay(today);
  record.value = r ? { ...r, answers: [...r.answers] } : undefined;
  streak.value = currentStreak(today);
}

function go(to: Screen) {
  refresh();
  screen.value = to;
  window.scrollTo(0, 0);
}

function start() {
  requestPersistence();
  go("play");
}

onMounted(async () => {
  // Send any feedback that was queued while offline.
  flushFlagQueue();
  window.addEventListener("online", flushFlagQueue);
  set.value = await fetchDailySet(today);
  loading.value = false;
});
</script>

<template>
  <PlayScreen v-if="screen === 'play' && set" :set="set" @done="go('results')" @quit="go('welcome')" />
  <ResultsScreen
    v-else-if="screen === 'results' && set && record"
    :set="set"
    :record="record"
    :streak="streak"
    @home="go('welcome')"
  />
  <WelcomeScreen
    v-else
    :date="today"
    :available="!!set"
    :loading="loading"
    :record="record"
    :streak="streak"
    @start="start"
    @results="go('results')"
  />
</template>
