<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { SECONDS_PER_QUESTION, type DailySet } from "@wizzit/shared";
import { getDay, updateDay } from "../lib/storage.ts";
import { scoreOf } from "../lib/daily.ts";

const props = defineProps<{ set: DailySet }>();
const emit = defineEmits<{ done: []; quit: [] }>();

const total = props.set.questions.length;

// If the page was reloaded while a question was open, that question counts as a timeout.
// Otherwise reloading would be a free way to see a question early and restart its timer.
const resumed = getDay(props.set.date);
if (resumed && resumed.openIndex !== undefined && resumed.openIndex === resumed.answers.length) {
  updateDay(props.set.date, (r) => {
    r.answers.push(null);
    r.openIndex = undefined;
  });
}

const answers = ref<(number | null)[]>([...(getDay(props.set.date)?.answers ?? [])]);
const flagged = ref<number[]>([...(getDay(props.set.date)?.flagged ?? [])]);

function toggleFlag(id: number) {
  flagged.value = flagged.value.includes(id) ? flagged.value.filter((x) => x !== id) : [...flagged.value, id];
  updateDay(props.set.date, (r) => {
    r.flagged = [...flagged.value];
  });
}
const index = ref(answers.value.length);
const phase = ref<"asking" | "revealed">("asking");
const remainingMs = ref(SECONDS_PER_QUESTION * 1000);

const question = computed(() => props.set.questions[index.value]);
const picked = computed(() => (phase.value === "revealed" ? answers.value[index.value] : undefined));
const isCorrect = computed(() => question.value && picked.value === question.value.answerIndex);
const secondsLeft = computed(() => Math.ceil(remainingMs.value / 1000));
const timeFraction = computed(() => remainingMs.value / (SECONDS_PER_QUESTION * 1000));

let deadline = 0;
let timer: number | undefined;

function startQuestion() {
  phase.value = "asking";
  remainingMs.value = SECONDS_PER_QUESTION * 1000;
  updateDay(props.set.date, (r) => {
    r.openIndex = index.value;
  });
  deadline = performance.now() + SECONDS_PER_QUESTION * 1000;
  clearInterval(timer);
  timer = window.setInterval(() => {
    remainingMs.value = Math.max(0, deadline - performance.now());
    if (remainingMs.value === 0) answer(null);
  }, 50);
}

function answer(choice: number | null) {
  if (phase.value !== "asking") return;
  clearInterval(timer);
  answers.value.push(choice);
  phase.value = "revealed";
  updateDay(props.set.date, (r) => {
    r.answers = [...answers.value];
    r.openIndex = undefined;
  });
}

function next() {
  if (index.value + 1 >= total) {
    updateDay(props.set.date, (r) => {
      r.completed = true;
      r.score = scoreOf(props.set, answers.value);
    });
    emit("done");
    return;
  }
  index.value++;
  startQuestion();
}

function choiceState(i: number): string {
  if (phase.value !== "revealed" || !question.value) return "";
  if (i === question.value.answerIndex) return "correct";
  if (i === picked.value) return "wrong";
  return "dim";
}

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (phase.value === "asking") {
    const n = Number(e.key);
    if (question.value && n >= 1 && n <= question.value.choices.length) answer(n - 1);
  } else if ((e.target as HTMLElement | null)?.closest?.(".flag")) {
    return; // let Enter/Space activate the focused flag button normally
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    next();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
  if (index.value >= total) {
    // Every question was already answered (e.g. reloaded on the last one).
    next();
    return;
  }
  startQuestion();
});
onBeforeUnmount(() => {
  clearInterval(timer);
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <main v-if="question" class="play">
    <header class="top">
      <button class="quit" aria-label="Back to home" @click="emit('quit')">✕</button>
      <div class="progress" :aria-label="`Question ${index + 1} of ${total}`">
        <span
          v-for="(q, i) in set.questions"
          :key="q.id"
          class="pip"
          :class="{
            right: i < answers.length && answers[i] === q.answerIndex,
            miss: i < answers.length && answers[i] !== q.answerIndex,
            current: i === index,
          }"
        />
      </div>
      <span class="count small muted">{{ index + 1 }}/{{ total }}</span>
    </header>

    <div class="timer" :class="{ low: secondsLeft <= 3 && phase === 'asking' }">
      <div class="bar" :style="{ transform: `scaleX(${phase === 'asking' ? timeFraction : 0})` }" />
    </div>
    <p class="seconds small" aria-live="off">
      <template v-if="phase === 'asking'">{{ secondsLeft }}s</template>
      <template v-else>&nbsp;</template>
    </p>

    <p class="category small">{{ question.category }}</p>
    <h1 class="prompt">{{ question.prompt }}</h1>

    <div class="choices" :class="{ two: question.choices.length === 2 }">
      <button
        v-for="(c, i) in question.choices"
        :key="`${question.id}-${i}`"
        class="choice"
        :class="choiceState(i)"
        :disabled="phase !== 'asking'"
        @click="answer(i)"
      >
        <span class="key" aria-hidden="true">{{ i + 1 }}</span>
        <span>{{ c }}</span>
      </button>
    </div>

    <section v-if="phase === 'revealed'" class="reveal card" aria-live="polite">
      <p class="verdict" :class="isCorrect ? 'yes' : 'no'">
        <template v-if="isCorrect">✓ Correct!</template>
        <template v-else-if="picked === null">⏱ Time's up</template>
        <template v-else>✗ Not quite</template>
      </p>
      <p v-if="!isCorrect" class="answer">
        Answer: <strong>{{ question.choices[question.answerIndex] }}</strong>
      </p>
      <p v-if="question.explanation" class="explanation">{{ question.explanation }}</p>
      <button class="btn" autofocus @click="next">
        {{ index + 1 >= total ? "See results" : "Next question" }}
      </button>
      <button
        class="flag small"
        :class="{ on: flagged.includes(question.id) }"
        :aria-pressed="flagged.includes(question.id)"
        @click="toggleFlag(question.id)"
      >
        <template v-if="flagged.includes(question.id)">🚩 Flagged. You can tell us why at the end. (Undo)</template>
        <template v-else>🚩 Something wrong with this question?</template>
      </button>
    </section>
  </main>
</template>

<style scoped>
.play {
  display: grid;
  gap: 12px;
}

.top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.quit {
  border: 0;
  background: none;
  font-size: 1.2rem;
  color: var(--muted);
  padding: 4px 8px;
  border-radius: 8px;
}
.progress {
  display: flex;
  gap: 4px;
}
.pip {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--surface-2);
}
.pip.right {
  background: var(--correct);
}
.pip.miss {
  background: var(--wrong);
}
.pip.current {
  background: var(--accent);
}

.timer {
  height: 10px;
  border-radius: 5px;
  background: var(--surface-2);
  overflow: hidden;
  margin-top: 8px;
}
.bar {
  height: 100%;
  background: var(--accent);
  transform-origin: left;
  transition: transform 0.05s linear, background 0.2s;
}
.timer.low .bar {
  background: var(--warn);
}
.seconds {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.category {
  margin: 4px 0 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.prompt {
  font-size: 1.4rem;
  font-weight: 650;
  margin-bottom: 8px;
}

.choices {
  display: grid;
  gap: 10px;
}
.choices.two {
  grid-template-columns: 1fr 1fr;
}
.choice {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 1.05rem;
  min-height: 56px;
  transition: border-color 0.15s, background 0.15s, opacity 0.15s;
}
.choice:not(:disabled):hover {
  border-color: var(--accent);
}
.choice:disabled {
  cursor: default;
}
.key {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--surface-2);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
}
.choice.correct {
  border-color: var(--correct);
  background: var(--correct-bg);
}
.choice.wrong {
  border-color: var(--wrong);
  background: var(--wrong-bg);
}
.choice.dim {
  opacity: 0.45;
}

.reveal {
  display: grid;
  gap: 10px;
  margin-top: 6px;
}
.reveal p {
  margin: 0;
}
.verdict {
  font-weight: 750;
  font-size: 1.15rem;
}
.verdict.yes {
  color: var(--correct);
}
.verdict.no {
  color: var(--wrong);
}
.explanation {
  color: var(--muted);
}
.flag {
  justify-self: center;
  border: 0;
  background: none;
  color: var(--muted);
  padding: 4px 8px;
  border-radius: 8px;
}
.flag:hover {
  color: var(--text);
}
.flag.on {
  color: var(--wrong);
  font-weight: 600;
}
</style>
