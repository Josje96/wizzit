<script setup lang="ts">
import { computed } from "vue";
import { QUESTIONS_PER_DAY, SECONDS_PER_QUESTION } from "@wizzit/shared";
import type { DayRecord } from "../lib/storage.ts";
import { prettyDate } from "../lib/dates.ts";

const props = defineProps<{
  date: string;
  available: boolean;
  loading: boolean;
  record?: DayRecord;
  streak: number;
}>();

const emit = defineEmits<{ start: []; results: [] }>();

const action = computed(() => {
  if (props.loading) return { label: "Loading today's questions…", disabled: true, onClick: () => {} };
  if (props.record?.completed) return { label: "See today's results", disabled: false, onClick: () => emit("results") };
  if (!props.available)
    return { label: "Today's questions aren't available", disabled: true, onClick: () => {} };
  if (props.record?.answers.length) return { label: "Continue today's challenge", disabled: false, onClick: () => emit("start") };
  return { label: "Start today's challenge", disabled: false, onClick: () => emit("start") };
});
</script>

<template>
  <main class="welcome">
    <header class="hero">
      <div class="logo" aria-hidden="true">W</div>
      <h1>Wizzit</h1>
      <p class="tagline">A 2-minute daily workout for your brain.</p>
    </header>

    <section class="card today">
      <p class="date muted small">{{ prettyDate(date) }}</p>
      <p v-if="streak > 0" class="streak">
        🔥 <strong>{{ streak }}-day streak</strong>
        <span v-if="!record?.completed" class="muted small"> · play today to keep it going</span>
      </p>
      <p v-if="record?.completed" class="done">
        You scored <strong>{{ record.score }}/{{ QUESTIONS_PER_DAY }}</strong> today. New questions at midnight.
      </p>
      <p v-else-if="!loading && !available" class="muted small">
        We couldn't load today's questions. Check your connection and try again.
      </p>
      <button class="btn" :disabled="action.disabled" @click="action.onClick">{{ action.label }}</button>
    </section>

    <section class="how">
      <h2>How it works</h2>
      <ul>
        <li>
          <span class="icon" aria-hidden="true">🗓️</span>
          <div>
            <strong>{{ QUESTIONS_PER_DAY }} questions a day.</strong>
            Everyone gets the same set, and every day is new.
          </div>
        </li>
        <li>
          <span class="icon" aria-hidden="true">⏱️</span>
          <div>
            <strong>{{ SECONDS_PER_QUESTION }} seconds each.</strong>
            Go with your gut. Running out of time counts as a miss.
          </div>
        </li>
        <li>
          <span class="icon" aria-hidden="true">⭐</span>
          <div>
            <strong>1 point per right answer.</strong>
            A perfect day is {{ QUESTIONS_PER_DAY }}/{{ QUESTIONS_PER_DAY }}.
          </div>
        </li>
        <li>
          <span class="icon" aria-hidden="true">🧭</span>
          <div>
            <strong>Learn things you'll actually use.</strong>
            Each day mixes general knowledge with everyday math: squaring a wall, reading a compass,
            how interest grows. Many answers come with a quick "why".
          </div>
        </li>
        <li>
          <span class="icon" aria-hidden="true">🔥</span>
          <div>
            <strong>Build a streak.</strong>
            Play every day to keep it going. No leaderboard, just you getting sharper.
          </div>
        </li>
        <li>
          <span class="icon" aria-hidden="true">🔒</span>
          <div>
            <strong>No account, no tracking.</strong>
            Your scores and streak stay on this device and never leave it.
          </div>
        </li>
      </ul>
    </section>

    <footer class="credits small muted">
      <h2>Credits</h2>
      <p>
        General knowledge questions come from
        <a href="https://opentdb.com" target="_blank" rel="noopener">Open Trivia Database</a> and
        <a href="https://github.com/uberspot/OpenTriviaQA" target="_blank" rel="noopener">OpenTriviaQA</a>, both used
        under the
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>
        license, some lightly edited. Thanks to their contributors.
      </p>
      <p>
        Everyday math and safety questions are written for Wizzit, using public guidance from USDA, NIST, OSHA, NOAA,
        and USGS. Math topics follow
        <a href="https://openstax.org" target="_blank" rel="noopener">OpenStax</a>
        <em>Contemporary Mathematics</em> and <em>Prealgebra 2e</em> (CC BY 4.0).
      </p>
    </footer>
  </main>
</template>

<style scoped>
.welcome {
  display: grid;
  gap: 28px;
}

.hero {
  text-align: center;
  padding-top: 16px;
}
.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: var(--accent);
  color: var(--accent-text);
  font-size: 2rem;
  font-weight: 800;
  transform: rotate(-6deg);
}
h1 {
  font-size: 2.4rem;
  letter-spacing: -0.02em;
}
.tagline {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 1.1rem;
}

.today {
  display: grid;
  gap: 12px;
}
.today p {
  margin: 0;
}
.date {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.streak {
  font-size: 1.05rem;
}

.how h2,
.credits h2 {
  font-size: 1.1rem;
  margin-bottom: 12px;
  color: var(--text);
}
.how ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.how li {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: start;
}
.icon {
  font-size: 1.3rem;
  line-height: 1.4;
}

.credits {
  border-top: 1px solid var(--border);
  padding-top: 20px;
}
.credits h2 {
  font-size: 0.95rem;
}
.credits p {
  margin: 0 0 8px;
}
</style>
