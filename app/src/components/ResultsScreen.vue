<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { FLAG_REASONS, MAX_FLAG_COMMENT, type DailySet, type FlagReason } from "@wizzit/shared";
import { updateDay, type DayRecord } from "../lib/storage.ts";
import { share, shareText } from "../lib/share.ts";
import { sendFlags } from "../lib/flags.ts";

const props = defineProps<{ set: DailySet; record: DayRecord; streak: number }>();
const emit = defineEmits<{ home: [] }>();

const total = props.set.questions.length;

const headline = computed(() => {
  const s = props.record.score;
  if (s === total) return "Perfect day!";
  if (s >= total * 0.8) return "Sharp!";
  if (s >= total * 0.5) return "Nice work";
  return "Every day counts";
});

const shareStatus = ref("");
async function onShare() {
  const result = await share(shareText(props.set, props.record.answers, props.record.score, props.streak));
  shareStatus.value =
    result === "copied" ? "Copied! Paste it anywhere." : result === "failed" ? "Couldn't share on this device." : "";
}

// ---------- flags & feedback ----------

const flagged = ref<number[]>([...(props.record.flagged ?? [])]);
const sent = ref<number[]>([...(props.record.flagsSent ?? [])]);
const reasons = reactive<Record<number, FlagReason | undefined>>({});
const comments = reactive<Record<number, string>>({});
const sending = ref(false);
const feedbackStatus = ref("");

/** Flagged questions still waiting for a reason. */
const pending = computed(() => props.set.questions.filter((q) => flagged.value.includes(q.id) && !sent.value.includes(q.id)));
const canSend = computed(() => pending.value.length > 0 && pending.value.every((q) => reasons[q.id]) && !sending.value);

function toggleFlag(id: number) {
  if (sent.value.includes(id)) return; // already reported
  flagged.value = flagged.value.includes(id) ? flagged.value.filter((x) => x !== id) : [...flagged.value, id];
  updateDay(props.set.date, (r) => {
    r.flagged = [...flagged.value];
  });
  feedbackStatus.value = "";
}

async function submitFeedback() {
  if (!canSend.value) return;
  sending.value = true;
  const ids = pending.value.map((q) => q.id);
  const result = await sendFlags({
    date: props.set.date,
    flags: ids.map((id) => ({ questionId: id, reason: reasons[id]!, comment: comments[id]?.trim() || undefined })),
  });
  sent.value = [...sent.value, ...ids];
  updateDay(props.set.date, (r) => {
    r.flagsSent = [...sent.value];
  });
  feedbackStatus.value =
    result === "sent"
      ? "Thanks! Your feedback helps make Wizzit better."
      : "Thanks! You're offline, so we'll send it next time you're connected.";
  sending.value = false;
}

const reasonEntries = Object.entries(FLAG_REASONS) as [FlagReason, string][];
</script>

<template>
  <main class="results">
    <section class="summary card">
      <p class="headline">{{ headline }}</p>
      <p class="score">
        <span class="big">{{ record.score }}</span><span class="of">/{{ total }}</span>
      </p>
      <p class="grid" aria-hidden="true">
        <span v-for="(q, i) in set.questions" :key="q.id">{{ record.answers[i] === q.answerIndex ? "🟩" : "🟥" }}</span>
      </p>
      <p v-if="streak > 0" class="streak">🔥 {{ streak }}-day streak</p>
      <button class="btn" @click="onShare">Share your score</button>
      <p v-if="shareStatus" class="small muted status" role="status">{{ shareStatus }}</p>
      <p class="small muted">New questions at midnight.</p>
    </section>

    <section v-if="pending.length" class="feedback card" aria-labelledby="fb-title">
      <h2 id="fb-title">🚩 Tell us what's wrong</h2>
      <p class="small muted">
        You flagged {{ pending.length }} question{{ pending.length === 1 ? "" : "s" }}. Pick a reason for each.
        Feedback is anonymous.
      </p>
      <div v-for="q in pending" :key="q.id" class="fb-item">
        <p class="fb-prompt">{{ q.prompt }}</p>
        <div class="reasons" role="radiogroup" :aria-label="`Reason for flagging: ${q.prompt}`">
          <button
            v-for="[key, label] in reasonEntries"
            :key="key"
            type="button"
            role="radio"
            class="reason"
            :aria-checked="reasons[q.id] === key"
            @click="reasons[q.id] = key"
          >
            {{ label }}
          </button>
        </div>
        <textarea
          v-model="comments[q.id]"
          class="comment"
          rows="2"
          :maxlength="MAX_FLAG_COMMENT"
          placeholder="Anything else? (optional)"
          :aria-label="`Comment about: ${q.prompt}`"
        />
      </div>
      <button class="btn" :disabled="!canSend" @click="submitFeedback">
        {{ sending ? "Sending…" : "Send feedback" }}
      </button>
    </section>
    <p v-if="feedbackStatus" class="small muted center" role="status">{{ feedbackStatus }}</p>

    <section class="review">
      <h2>Review</h2>
      <ol>
        <li v-for="(q, i) in set.questions" :key="q.id" class="item">
          <p class="prompt">
            <span :class="record.answers[i] === q.answerIndex ? 'ok' : 'bad'">{{
              record.answers[i] === q.answerIndex ? "✓" : "✗"
            }}</span>
            {{ q.prompt }}
          </p>
          <p class="small">
            <template v-if="record.answers[i] === q.answerIndex">
              <strong>{{ q.choices[q.answerIndex] }}</strong>
            </template>
            <template v-else>
              <span class="muted">
                {{ record.answers[i] == null ? "Ran out of time" : `You said ${q.choices[record.answers[i]!]}` }} ·
              </span>
              Answer: <strong>{{ q.choices[q.answerIndex] }}</strong>
            </template>
          </p>
          <p v-if="q.explanation" class="small muted">{{ q.explanation }}</p>
          <button
            class="flag small"
            :class="{ on: flagged.includes(q.id) }"
            :disabled="sent.includes(q.id)"
            :aria-pressed="flagged.includes(q.id)"
            @click="toggleFlag(q.id)"
          >
            <template v-if="sent.includes(q.id)">🚩 Reported</template>
            <template v-else-if="flagged.includes(q.id)">🚩 Flagged (undo)</template>
            <template v-else>🚩 Flag</template>
          </button>
        </li>
      </ol>
    </section>

    <button class="btn secondary" @click="emit('home')">Back to home</button>
  </main>
</template>

<style scoped>
.results {
  display: grid;
  gap: 24px;
}

.summary {
  text-align: center;
  display: grid;
  gap: 10px;
  padding: 28px 18px;
}
.summary p {
  margin: 0;
}
.headline {
  font-size: 1.3rem;
  font-weight: 700;
}
.score {
  font-variant-numeric: tabular-nums;
}
.big {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  color: var(--accent);
}
.of {
  font-size: 1.6rem;
  color: var(--muted);
  font-weight: 700;
}
.grid {
  font-size: 1.3rem;
  letter-spacing: 2px;
}
.streak {
  font-weight: 650;
}

.feedback {
  display: grid;
  gap: 14px;
}
.feedback h2 {
  font-size: 1.1rem;
}
.feedback p {
  margin: 0;
}
.fb-item {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.fb-prompt {
  font-weight: 600;
}
.reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.reason {
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.875rem;
}
.reason[aria-checked="true"] {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-text);
}
.comment {
  font: inherit;
  color: inherit;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  resize: vertical;
}
.center {
  text-align: center;
  margin: -12px 0 0;
}

.review h2 {
  font-size: 1.1rem;
  margin-bottom: 12px;
}
.review ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.item {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.item p {
  margin: 0 0 4px;
}
.prompt {
  font-weight: 600;
}
.ok {
  color: var(--correct);
}
.bad {
  color: var(--wrong);
}
.flag {
  border: 0;
  background: none;
  color: var(--muted);
  padding: 2px 0;
}
.flag:hover:not(:disabled) {
  color: var(--text);
}
.flag.on,
.flag:disabled {
  color: var(--wrong);
  font-weight: 600;
}
.flag:disabled {
  cursor: default;
}
</style>
