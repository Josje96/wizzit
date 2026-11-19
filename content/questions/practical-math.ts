// Original practical-math questions: formulas that help in everyday life.
// We own this content outright. Every question must be answerable within 10 seconds:
// concepts, estimates, or round numbers — no long calculations.
//
// `ref` is the stable id used for upserts. Never reuse or rename a ref once seeded;
// edit the text in place instead.

export interface OriginalQuestion {
  ref: string;
  category: string;
  prompt: string;
  correct: string;
  incorrect: string[];
  explanation: string;
}

const NAV = "Navigation";
const DIY = "Home & DIY";
const MONEY = "Money";
const KITCHEN = "Kitchen";
const MEASURE = "Measurement";
const TRAVEL = "Travel";

// ---------- helpers ----------

/** 3 distinct distractors from `candidates`, excluding the correct answer. */
export function pick(correct: string, candidates: string[], n = 3): string[] {
  const out: string[] = [];
  for (const c of candidates) {
    if (c !== correct && !out.includes(c)) out.push(c);
    if (out.length === n) return out;
  }
  throw new Error(`Not enough distractors for "${correct}": ${candidates.join(", ")}`);
}

/** Round to 2 decimals and drop trailing zeros. */
export function num(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Whole numbers and halves, written the way a recipe would: 1.5 -> "1½". */
export function frac(n: number): string {
  const whole = Math.floor(n);
  const half = Math.abs(n - whole - 0.5) < 1e-9;
  if (half) return whole === 0 ? "½" : `${whole}½`;
  return num(n);
}

/** $60, $3.75 */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? `$${r.toLocaleString("en-US")}` : `$${r.toFixed(2)}`;
}

// ---------- fixed questions ----------

const fixed: OriginalQuestion[] = [
  // Navigation
  {
    ref: "nav-due-west",
    category: NAV,
    prompt: "On a compass, what bearing is due West?",
    correct: "270°",
    incorrect: ["90°", "180°", "360°"],
    explanation: "Bearings go clockwise from North: N 0°, E 90°, S 180°, W 270°.",
  },
  {
    ref: "nav-southeast",
    category: NAV,
    prompt: "What bearing is Southeast?",
    correct: "135°",
    incorrect: ["45°", "225°", "315°"],
    explanation: "Southeast is halfway between East (90°) and South (180°).",
  },
  {
    ref: "nav-declination",
    category: NAV,
    prompt: "The angle between magnetic north and true north is called…",
    correct: "Declination",
    incorrect: ["Azimuth", "Latitude", "Parallax"],
    explanation: "Declination changes by location. Maps list it so you can correct your compass reading.",
  },
  {
    ref: "nav-sunrise",
    category: NAV,
    prompt: "Roughly which direction does the sun rise?",
    correct: "East",
    incorrect: ["West", "North", "South"],
    explanation: "It rises roughly east and sets roughly west, drifting north or south of due east with the seasons.",
  },
  {
    ref: "nav-parallels",
    category: NAV,
    prompt: "Lines of latitude are also called…",
    correct: "Parallels",
    incorrect: ["Meridians", "Bearings", "Contours"],
    explanation: "Latitude lines run parallel to the equator. Longitude lines (meridians) run pole to pole.",
  },
  {
    ref: "nav-full-turn",
    category: NAV,
    prompt: "How many degrees are in a full turn on a compass?",
    correct: "360°",
    incorrect: ["180°", "270°", "100°"],
    explanation: "A full circle is 360°, so North is both 0° and 360°.",
  },
  {
    ref: "nav-right-turn",
    category: NAV,
    prompt: "You're heading North (0°) and turn 90° to the right. What's your new bearing?",
    correct: "90°",
    incorrect: ["270°", "180°", "45°"],
    explanation: "Bearings increase clockwise, so a right turn adds: 0° + 90° = 90° (East).",
  },

  // Home & DIY
  {
    ref: "diy-345",
    category: DIY,
    prompt: "To check a corner is square, you mark 3 ft on one wall and 4 ft on the other. The diagonal should be…",
    correct: "5 ft",
    incorrect: ["6 ft", "7 ft", "4½ ft"],
    explanation: "3² + 4² = 5² (9 + 16 = 25). A 5 ft diagonal means a true 90° corner. This is the 3-4-5 rule.",
  },
  {
    ref: "diy-equal-diagonals",
    category: DIY,
    prompt: "A four-sided frame with equal opposite sides is perfectly square at the corners when its diagonals are…",
    correct: "Equal length",
    incorrect: ["Different lengths", "Half the perimeter", "Shorter than the sides"],
    explanation: "Measure corner to corner both ways. Equal diagonals mean a true rectangle, the standard check for decks and foundations.",
  },
  {
    ref: "diy-roof-pitch",
    category: DIY,
    prompt: "A \"6 in 12\" roof pitch rises 6 inches for every…",
    correct: "12 inches across",
    incorrect: ["12 feet across", "12 inches of rafter", "12 degrees"],
    explanation: "Pitch is rise over run: 6 in. up for every 12 in. of horizontal distance.",
  },
  {
    ref: "diy-sq-yard",
    category: DIY,
    prompt: "How many square feet are in one square yard?",
    correct: "9",
    incorrect: ["3", "6", "12"],
    explanation: "A yard is 3 ft, so a square yard is 3 × 3 = 9 sq ft. Handy for carpet, sod, and gravel.",
  },
  {
    ref: "diy-paint-coverage",
    category: DIY,
    prompt: "One gallon of paint covers roughly how many square feet?",
    correct: "350–400",
    incorrect: ["100–150", "800–1,000", "50–75"],
    explanation: "Most labels say about 350–400 sq ft per coat. Plan on two coats for a big color change.",
  },
  {
    ref: "diy-stud-spacing",
    category: DIY,
    prompt: "In most US homes, wall studs are spaced how far apart, center to center?",
    correct: "16 inches",
    incorrect: ["12 inches", "20 inches", "30 inches"],
    explanation: "16 in. on center is the standard. 24 in. also shows up in some newer construction.",
  },
  {
    ref: "diy-triangle-sum",
    category: DIY,
    prompt: "The three angles of any triangle add up to…",
    correct: "180°",
    incorrect: ["90°", "360°", "270°"],
    explanation: "So if one corner is 90°, the other two must add up to 90°.",
  },
  {
    ref: "diy-miter",
    category: DIY,
    prompt: "To join two boards in a 90° corner, like a picture frame, each is cut at…",
    correct: "45°",
    incorrect: ["90°", "30°", "60°"],
    explanation: "Two 45° miter cuts add up to the 90° corner.",
  },

  // Money
  {
    ref: "money-simple-interest",
    category: MONEY,
    prompt: "Simple interest is paid only on…",
    correct: "The original amount",
    incorrect: ["The original plus past interest", "The interest earned so far", "Your highest balance"],
    explanation: "Compound interest also earns interest on past interest, which is why it grows faster.",
  },
  {
    ref: "money-compound-wins",
    category: MONEY,
    prompt: "Same rate, same 20 years. Which earns more?",
    correct: "Compound interest",
    incorrect: ["Simple interest", "They're equal", "Depends on the bank"],
    explanation: "Compounding earns interest on interest, so the gap widens every single year.",
  },
  {
    ref: "money-apy",
    category: MONEY,
    prompt: "Which rate includes the effect of compounding?",
    correct: "APY",
    incorrect: ["APR", "Prime rate", "Principal"],
    explanation: "APY (annual percentage yield) is what you actually earn in a year with compounding. APR leaves it out.",
  },
  {
    ref: "money-cc-monthly",
    category: MONEY,
    prompt: "A credit card charges 24% APR. Roughly what is that per month?",
    correct: "2%",
    incorrect: ["24%", "4%", "0.5%"],
    explanation: "24% ÷ 12 months = 2% a month, charged on any balance you carry.",
  },
  {
    ref: "money-compounded-monthly",
    category: MONEY,
    prompt: "\"Compounded monthly\" means interest is added…",
    correct: "12 times a year",
    incorrect: ["Once a year", "Every day", "Only at the end"],
    explanation: "Each month's interest is added to the balance, and the next month earns interest on it.",
  },

  // Kitchen
  {
    ref: "kitchen-tbsp-per-cup",
    category: KITCHEN,
    prompt: "How many tablespoons are in one cup?",
    correct: "16",
    incorrect: ["8", "12", "24"],
    explanation: "1 cup = 16 tbsp, so ¼ cup = 4 tbsp.",
  },
  {
    ref: "kitchen-tsp-per-tbsp",
    category: KITCHEN,
    prompt: "How many teaspoons make one tablespoon?",
    correct: "3",
    incorrect: ["2", "4", "5"],
    explanation: "3 tsp = 1 tbsp. No tablespoon handy? Use three teaspoons.",
  },
  {
    ref: "kitchen-freezing-f",
    category: KITCHEN,
    prompt: "Water freezes at what temperature in °F?",
    correct: "32°F",
    incorrect: ["0°F", "40°F", "212°F"],
    explanation: "32°F = 0°C. Water boils at 212°F (100°C) at sea level.",
  },

  // Measurement & travel
  {
    ref: "measure-inch-cm",
    category: MEASURE,
    prompt: "One inch is how many centimeters?",
    correct: "2.54",
    incorrect: ["1.5", "3.25", "10"],
    explanation: "1 in = 2.54 cm exactly. A 30 cm ruler is about 12 inches.",
  },
  {
    ref: "measure-km-mile",
    category: MEASURE,
    prompt: "One kilometer is roughly how many miles?",
    correct: "0.62",
    incorrect: ["1.6", "0.25", "1.0"],
    explanation: "1 km ≈ 0.62 mi (and 1 mi ≈ 1.6 km). A 5K race is about 3.1 miles.",
  },
  {
    ref: "measure-feet-mile",
    category: MEASURE,
    prompt: "How many feet are in a mile?",
    correct: "5,280",
    incorrect: ["1,000", "3,280", "5,000"],
    explanation: "5,280 ft = 1 mile. Fun fact: a kilometer is about 3,280 ft.",
  },
  {
    ref: "travel-mpg",
    category: TRAVEL,
    prompt: "You drive 300 miles on 10 gallons. What's your fuel economy?",
    correct: "30 mpg",
    incorrect: ["3 mpg", "25 mpg", "35 mpg"],
    explanation: "Miles ÷ gallons: 300 ÷ 10 = 30 mpg.",
  },
];

// ---------- templates (number variants) ----------

function backBearings(): OriginalQuestion[] {
  return [30, 45, 60, 120, 135, 150, 200, 225, 250, 300, 315, 330].map((b) => {
    const back = (b + 180) % 360;
    const op = b < 180 ? "Add" : "Subtract";
    return {
      ref: `nav-back-bearing:${b}`,
      category: NAV,
      prompt: `You hiked out on a bearing of ${b}°. What bearing leads you straight back?`,
      correct: `${back}°`,
      incorrect: pick(`${back}°`, [
        `${(360 - b) % 360}°`,
        `${(b + 90) % 360}°`,
        `${(b + 270) % 360}°`,
        `${Math.abs(180 - b)}°`,
        `${(back + 45) % 360}°`,
        `${(back + 315) % 360}°`,
      ]),
      explanation: `${op} 180°: ${b}° → ${back}°. That's called the back bearing.`,
    };
  });
}

function ruleOf72(): OriginalQuestion[] {
  const rates = [2, 3, 4, 6, 8, 9, 12];
  const years = rates.map((r) => 72 / r);
  return rates.map((r, i) => {
    const y = years[i]!;
    // Closest other answers make the best distractors.
    const others = years
      .filter((_, j) => j !== i)
      .sort((a, b) => Math.abs(a - y) - Math.abs(b - y))
      .map((v) => `${v} years`);
    return {
      ref: `money-rule-72:${r}`,
      category: MONEY,
      prompt: `At ${r}% a year, about how many years until your money doubles?`,
      correct: `${y} years`,
      incorrect: pick(`${y} years`, others),
      explanation: `Rule of 72: divide 72 by the rate. 72 ÷ ${r} = ${y} years. It works for inflation and debt too.`,
    };
  });
}

function squaringCorners(): OriginalQuestion[] {
  // 3-4-5 itself is a fixed question above.
  const triples: [number, number, number][] = [
    [6, 8, 10],
    [9, 12, 15],
    [5, 12, 13],
    [8, 15, 17],
  ];
  return triples.map(([a, b, c]) => ({
    ref: `diy-pythagoras:${a}-${b}-${c}`,
    category: DIY,
    prompt: `Squaring a corner: you mark ${a} ft on one wall and ${b} ft on the other. What should the diagonal be?`,
    correct: `${c} ft`,
    incorrect: pick(`${c} ft`, [`${a + b} ft`, `${c + 1} ft`, `${c - 1} ft`, `${c + 2} ft`]),
    explanation: `${a}² + ${b}² = ${c}² (${a * a} + ${b * b} = ${c * c}). A ${c} ft diagonal means a true 90° corner.`,
  }));
}

function percentOff(): OriginalQuestion[] {
  const items: [number, number][] = [
    [80, 25],
    [40, 25],
    [60, 50],
    [120, 25],
    [50, 20],
    [200, 15],
    [30, 10],
    [150, 20],
  ];
  return items.map(([price, pct]) => {
    const discount = (price * pct) / 100;
    const sale = price - discount;
    return {
      ref: `money-percent-off:${price}-${pct}`,
      category: MONEY,
      prompt: `A jacket costs ${money(price)} and is ${pct}% off. What do you pay?`,
      correct: money(sale),
      incorrect: pick(money(sale), [
        money(discount),
        money(price - pct),
        money(price - discount / 2),
        money(sale + 10),
        money(sale - 5),
      ]),
      explanation: `${pct}% of ${money(price)} is ${money(discount)}, so you pay ${money(price)} − ${money(discount)} = ${money(sale)}.`,
    };
  });
}

function tips(): OriginalQuestion[] {
  return [25, 40, 50, 60, 75, 85, 120].map((bill) => {
    const tip = bill * 0.2;
    return {
      ref: `money-tip-20:${bill}`,
      category: MONEY,
      prompt: `Your bill is ${money(bill)}. What's a 20% tip?`,
      correct: money(tip),
      incorrect: pick(money(tip), [money(bill * 0.15), money(bill * 0.25), money(bill * 0.1)]),
      explanation: `Take 10% by moving the decimal (${money(bill / 10)}), then double it: ${money(tip)}.`,
    };
  });
}

function compoundTwoYears(): OriginalQuestion[] {
  return [500, 1000, 2000, 5000].map((p) => {
    const y1 = p * 1.1;
    const y2 = p * 1.21;
    const simple = p * 1.2;
    return {
      ref: `money-compound-2y:${p}`,
      category: MONEY,
      prompt: `${money(p)} earns 10% a year, compounded yearly. What's it worth after 2 years?`,
      correct: money(y2),
      incorrect: pick(money(y2), [money(simple), money(y1), money(p * 1.3)]),
      explanation: `Year 1: ${money(p)} + 10% = ${money(y1)}. Year 2 earns 10% on that: ${money(y2)}. Simple interest would only reach ${money(simple)}.`,
    };
  });
}

function celsiusToF(): OriginalQuestion[] {
  return [0, 10, 20, 25, 30, 37, 40, 100].map((c) => {
    const f = num(c * 1.8 + 32);
    return {
      ref: `kitchen-c-to-f:${c}`,
      category: KITCHEN,
      prompt: `What is ${c}°C in °F?`,
      correct: `${f}°F`,
      incorrect: pick(`${f}°F`, [
        // Not offering the "double + 30" estimate as a wrong answer: the explanation teaches it.
        `${c + 32}°F`,
        `${num(Number(f) + 10)}°F`,
        `${num(Number(f) - 10)}°F`,
        `${num(Number(f) + 20)}°F`,
      ]),
      explanation: `°F = °C × 1.8 + 32, so ${c} × 1.8 + 32 = ${f}. Quick estimate: double it and add 30.`,
    };
  });
}

function speedDistance(): OriginalQuestion[] {
  const trips: [number, number][] = [
    [60, 2],
    [50, 3],
    [40, 1.5],
    [30, 0.5],
    [70, 2],
    [65, 4],
  ];
  const duration = (t: number) =>
    t === 0.5 ? "30 minutes" : t === 1 ? "1 hour" : t === 1.5 ? "1½ hours" : `${t} hours`;
  return trips.map(([speed, hours]) => {
    const d = speed * hours;
    return {
      ref: `travel-distance:${speed}-${hours}`,
      category: TRAVEL,
      prompt: `Driving at ${speed} mph for ${duration(hours)}, how far do you go?`,
      correct: `${d} miles`,
      incorrect: pick(`${d} miles`, [`${d - 10} miles`, `${d + 10} miles`, `${d + 20} miles`]),
      explanation: `Distance = speed × time: ${speed} × ${hours} = ${d} miles.`,
    };
  });
}

function recipeScaling(): OriginalQuestion[] {
  const recipes: [from: number, to: number, qty: number, unit: string, item: string][] = [
    [4, 6, 2, "cups", "flour"],
    [4, 8, 1.5, "cups", "rice"],
    [6, 3, 2, "cups", "milk"],
    [4, 2, 3, "tbsp", "butter"],
    [4, 12, 1, "cup", "sugar"],
    [2, 5, 2, "cups", "broth"],
  ];
  return recipes.map(([from, to, qty, unit, item]) => {
    const ans = (qty * to) / from;
    const plural = unit === "cup" ? "cups" : unit;
    return {
      ref: `kitchen-scale:${from}-${to}-${qty}-${item}`,
      category: KITCHEN,
      prompt: `A recipe that serves ${from} uses ${frac(qty)} ${unit} of ${item}. How many ${plural} to serve ${to}?`,
      correct: frac(ans),
      incorrect: pick(
        frac(ans),
        [qty + (to - from), qty * 2, ans + 1, ans + 0.5, ans - 0.5].filter((n) => n > 0).map(frac),
      ),
      explanation: `Multiply by ${to}/${from}: ${frac(qty)} × ${to} ÷ ${from} = ${frac(ans)}.`,
    };
  });
}

export const practicalMath: OriginalQuestion[] = [
  ...fixed,
  ...backBearings(),
  ...ruleOf72(),
  ...squaringCorners(),
  ...percentOff(),
  ...tips(),
  ...compoundTwoYears(),
  ...celsiusToF(),
  ...speedDistance(),
  ...recipeScaling(),
];
