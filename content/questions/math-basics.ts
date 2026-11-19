// Everyday math reasoning: percents, fractions, probability, statistics, geometry.
// Written for Wizzit. Topic coverage follows OpenStax "Contemporary Mathematics" and
// "Prealgebra 2e" (CC BY 4.0, openstax.org) — no text is copied from them; credit is given
// in the app. Every question must be answerable within 10 seconds.

import type { OriginalQuestion } from "./practical-math.ts";
import { frac, money, num, pick } from "./practical-math.ts";

const MATH = "Math";
const MONEY = "Money";

const q = (
  ref: string,
  category: string,
  prompt: string,
  correct: string,
  incorrect: string[],
  explanation: string,
): OriginalQuestion => ({ ref, category, prompt, correct, incorrect, explanation });

const fixed: OriginalQuestion[] = [
  // Probability
  q("math-coin-streak", MATH, "A fair coin lands heads 5 times in a row. What's the chance the next flip is heads?", "50%",
    ["Less than 50%", "More than 50%", "Almost 0%"],
    "Coins have no memory. Believing a streak changes the odds is called the gambler's fallacy."),
  q("math-die-six", MATH, "What's the chance of rolling a 6 on one regular die?", "1 in 6",
    ["1 in 3", "1 in 12", "1 in 2"], "Six equally likely faces, one of them a 6."),
  q("math-card-heart", MATH, "Draw one card from a shuffled deck. Chance it's a heart?", "1 in 4",
    ["1 in 13", "1 in 2", "1 in 52"], "13 hearts out of 52 cards = 1/4."),
  q("math-two-heads", MATH, "Flip two coins. What's the chance both land heads?", "1 in 4",
    ["1 in 2", "1 in 3", "1 in 8"], "HH, HT, TH, TT: one outcome out of four."),
  q("math-dice-seven", MATH, "Which total is most likely when you roll two dice?", "7",
    ["12", "2", "10"], "Six combinations make 7 (1+6, 2+5, 3+4…). Only one makes 2 or 12."),

  // Statistics
  q("math-median-outlier", MATH, "A billionaire moves into a small town. Which barely changes?", "Median income",
    ["Average (mean) income", "Total income", "Highest income"],
    "One huge value drags the mean way up, but the middle value (median) hardly moves."),
  q("math-mode-meaning", MATH, "In a list of numbers, the \"mode\" is…", "The most common value",
    ["The middle value", "The average", "The biggest minus smallest"],
    "Mode = most frequent, median = middle, mean = average, range = max − min."),

  // Arithmetic & fractions
  q("math-order-of-ops", MATH, "What is 2 + 3 × 4?", "14",
    ["20", "24", "9"], "Multiply before adding: 3 × 4 = 12, then 2 + 12 = 14."),
  q("math-negative-temp", MATH, "It's −5°F and warms up 12 degrees. What's the temperature now?", "7°F",
    ["17°F", "−17°F", "−7°F"], "−5 + 12 = 7. Count up 5 to reach zero, then 7 more."),
  q("math-estimate-19x21", MATH, "Quick estimate: 19 × 21 is closest to…", "400",
    ["200", "4,000", "40"], "Round to 20 × 20 = 400. (The exact answer is 399.)"),
  q("math-eighth-percent", MATH, "⅛ written as a percent is…", "12.5%",
    ["8%", "18%", "25%"], "1 ÷ 8 = 0.125 = 12.5%. Handy: ⅛ cup is 2 tablespoons."),
  q("math-three-quarters", MATH, "0.75 written as a fraction is…", "¾",
    ["⅔", "⅞", "7/5"], "75 cents is three quarters of a dollar."),
  q("math-half-plus-quarter", MATH, "½ cup + ¼ cup = ?", "¾ cup",
    ["⅔ cup", "1 cup", "2/6 cup"], "½ = 2/4, and 2/4 + 1/4 = 3/4."),
  q("math-concrete-ratio", MATH, "A 1:2:3 concrete mix (cement : sand : gravel) uses 2 buckets of cement. How much sand?", "4 buckets",
    ["2 buckets", "3 buckets", "6 buckets"], "Sand is twice the cement in a 1:2:3 mix, so 2 × 2 = 4."),

  // Geometry
  q("math-wheel-circumference", MATH, "A wheel 10 inches across rolls one full turn. About how far does it go?", "31 inches",
    ["10 inches", "20 inches", "100 inches"], "Circumference = π × diameter ≈ 3.14 × 10 = 31.4 inches."),
  q("math-circle-area", MATH, "About what's the area of a circle with a 10-ft radius?", "314 sq ft",
    ["31 sq ft", "100 sq ft", "1,000 sq ft"], "Area = π × r² ≈ 3.14 × 100 = 314 sq ft."),
  q("math-double-sides-area", MATH, "Double the length and width of a garden bed. Its area becomes…", "4 times bigger",
    ["2 times bigger", "3 times bigger", "8 times bigger"], "2 × 2 = 4. Double all three dimensions of a box and the volume is 8 times bigger."),

  // Money
  q("money-markup-50", MONEY, "A store pays $20 for a shirt and marks it up 50%. What's the price?", "$30",
    ["$25", "$40", "$70"], "50% of $20 is $10, so $20 + $10 = $30."),
  q("money-rent-increase", MONEY, "Rent goes from $1,000 to $1,100. What's the percent increase?", "10%",
    ["1%", "100%", "11%"], "Increase ÷ original: $100 ÷ $1,000 = 10%."),
];

// ---------- templates ----------

function percentOf(): OriginalQuestion[] {
  const items: [pct: number, amount: number][] = [[15, 60], [15, 40], [25, 80], [30, 50], [5, 240], [75, 40]];
  return items.map(([pct, amount]) => {
    const ans = (pct * amount) / 100;
    const trick =
      pct === 15 ? `10% is ${money(amount / 10)}, 5% is half that, together ${money(ans)}.`
      : pct === 25 ? `25% is a quarter: ${money(amount)} ÷ 4 = ${money(ans)}.`
      : pct === 75 ? `75% is three quarters: ${money(amount / 4)} × 3 = ${money(ans)}.`
      : pct === 5 ? `10% is ${money(amount / 10)}, and 5% is half that: ${money(ans)}.`
      : `10% is ${money(amount / 10)}, so ${pct}% is ${pct / 10} × that = ${money(ans)}.`;
    return q(`math-percent-of:${pct}-${amount}`, MATH, `What's ${pct}% of ${money(amount)}?`,
      money(ans), pick(money(ans), [money(ans * 2), money(ans + 5), money(amount - ans), money(ans / 2), money(ans + 1)]),
      trick);
  });
}

function median(): OriginalQuestion[] {
  const lists = [[3, 9, 4, 7, 5], [10, 2, 8, 6, 1], [12, 15, 11, 30, 14], [5, 1, 9, 3, 7]];
  return lists.map((xs) => {
    const sorted = [...xs].sort((a, b) => a - b);
    const med = sorted[2]!;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    return q(`math-median:${xs.join("-")}`, MATH, `What's the median of ${xs.join(", ")}?`,
      String(med), pick(String(med), [num(mean), String(xs[2]), String(sorted[4]! - sorted[0]!), String(med + 1), String(med - 1)]),
      `Sort them (${sorted.join(", ")}) and take the middle one: ${med}.`);
  });
}

function mean(): OriginalQuestion[] {
  const lists = [[2, 4, 6], [10, 20, 30, 40], [5, 5, 8], [80, 90, 100], [1, 2, 3, 4, 5]];
  return lists.map((xs) => {
    const sum = xs.reduce((a, b) => a + b, 0);
    const avg = sum / xs.length;
    return q(`math-mean:${xs.join("-")}`, MATH, `What's the average of ${xs.join(", ")}?`,
      num(avg), pick(num(avg), [num(sum), num(avg + 1), num(avg - 1), num(avg + 2), num(avg * 2)]),
      `Add them up (${sum}) and divide by how many there are (${xs.length}): ${num(avg)}.`);
  });
}

function simpleInterest(): OriginalQuestion[] {
  const loans: [p: number, rate: number, years: number][] = [[1000, 5, 3], [2000, 4, 2], [500, 10, 2], [5000, 3, 4]];
  return loans.map(([p, rate, years]) => {
    const interest = (p * rate * years) / 100;
    return q(`money-simple-interest:${p}-${rate}-${years}`, MONEY,
      `${money(p)} at ${rate}% simple interest for ${years} years earns how much interest?`,
      money(interest), pick(money(interest), [money((p * rate) / 100), money(interest * 2), money(p + interest), money(interest + 50)]),
      `Interest = principal × rate × time: ${money(p)} × ${rate}% × ${years} = ${money(interest)}.`);
  });
}

function mapScale(): OriginalQuestion[] {
  const maps: [perInch: number, inches: number][] = [[5, 3], [10, 2.5], [2, 7], [25, 4], [50, 1.5]];
  return maps.map(([perInch, inches]) => {
    const miles = perInch * inches;
    const mi = (n: number) => `${num(n)} miles`;
    return q(`math-map-scale:${perInch}-${inches}`, MATH,
      `A map's scale is 1 inch = ${perInch} miles. Two towns are ${frac(inches)} inches apart. How far is that?`,
      mi(miles), pick(mi(miles), [mi(perInch + inches), mi(miles * 2), mi(miles / 2), mi(miles + perInch)]),
      `${frac(inches)} × ${perInch} = ${num(miles)} miles.`);
  });
}

function addFractions(): OriginalQuestion[] {
  // [a, b, answer, wrong answers] using common kitchen/shop fractions
  const sums: [string, string, string, string[], string][] = [
    ["½", "⅓", "⅚", ["⅖", "⅔", "1"], "Common denominator 6: 3/6 + 2/6 = 5/6."],
    ["¼", "⅛", "⅜", ["2/12", "½", "⅕"], "¼ = 2/8, so 2/8 + 1/8 = 3/8."],
    ["⅔", "⅓", "1", ["¾", "3/6", "1⅓"], "Same denominator: 2/3 + 1/3 = 3/3 = 1."],
    ["¾", "½", "1¼", ["1", "4/6", "1½"], "½ = 2/4, so 3/4 + 2/4 = 5/4 = 1¼."],
  ];
  return sums.map(([a, b, ans, wrong, why], i) =>
    q(`math-add-fractions:${i}`, MATH, `${a} + ${b} = ?`, ans, wrong, why),
  );
}

export const mathBasics: OriginalQuestion[] = [
  ...fixed,
  ...percentOf(),
  ...median(),
  ...mean(),
  ...simpleInterest(),
  ...mapScale(),
  ...addFractions(),
];
