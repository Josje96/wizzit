// Everyday practical knowledge: safety rules, kitchen measures, home projects, money, travel.
// Written for Wizzit. Facts come from public-domain US government sources where possible:
//   USDA FSIS   safe minimum internal temperatures (fsis.usda.gov)
//   NIST        cooking measurement equivalencies (nist.gov/pml/owm/cooking-measurement-equivalencies)
//   OSHA        Portable Ladder Safety QuickCard, OSHA 3246 (osha.gov)
//   NOAA / NWS  lightning & thunder (weather.gov/safety/lightning-science-thunder), flood safety
//   AHA         CPR guidelines (rate 100–120/min, depth ~2 in.)
//   USGS        topographic map scale (1:24,000)
// Same rules as practical-math.ts: answerable in 10 seconds, stable refs.

import type { OriginalQuestion } from "./practical-math.ts";
import { frac, money, pick } from "./practical-math.ts";

const KITCHEN = "Kitchen";
const DIY = "Home & DIY";
const MONEY = "Money";
const NAV = "Navigation";
const SAFETY = "Safety";
const MEASURE = "Measurement";
const TRAVEL = "Travel";

const q = (
  ref: string,
  category: string,
  prompt: string,
  correct: string,
  incorrect: string[],
  explanation: string,
): OriginalQuestion => ({ ref, category, prompt, correct, incorrect, explanation });

const fixed: OriginalQuestion[] = [
  // ---- Kitchen: food safety (USDA FSIS) ----
  q("kitchen-poultry-temp", KITCHEN, "What internal temperature makes chicken safe to eat?", "165°F",
    ["145°F", "155°F", "125°F"],
    "USDA: cook all poultry, including ground, to 165°F. Check the thickest part with a thermometer."),
  q("kitchen-ground-beef-temp", KITCHEN, "What's the minimum safe internal temperature for a hamburger?", "160°F",
    ["145°F", "130°F", "120°F"],
    "Ground meat needs 160°F because grinding spreads surface bacteria all the way through."),
  q("kitchen-steak-temp", KITCHEN, "Minimum safe temperature for a beef steak or pork chop (plus a 3-minute rest)?", "145°F",
    ["125°F", "135°F", "165°F"],
    "Whole cuts of beef, pork, veal, and lamb: 145°F, then rest at least 3 minutes (USDA)."),
  q("kitchen-danger-zone", KITCHEN, "Bacteria multiply fastest in the food \"danger zone\" between…", "40°F and 140°F",
    ["0°F and 32°F", "140°F and 212°F", "-10°F and 20°F"],
    "Keep cold food below 40°F and hot food above 140°F."),
  q("kitchen-two-hour-rule", KITCHEN, "Leftovers should go into the fridge within…", "2 hours",
    ["6 hours", "12 hours", "24 hours"],
    "Two hours at room temperature, or just 1 hour if it's above 90°F (like a summer picnic)."),
  q("kitchen-fridge-temp", KITCHEN, "Your refrigerator should be set at or below…", "40°F",
    ["50°F", "55°F", "60°F"],
    "40°F or colder slows bacteria. A cheap fridge thermometer tells you for sure."),
  q("kitchen-freezer-temp", KITCHEN, "A freezer should be kept at…", "0°F",
    ["32°F", "20°F", "10°F"],
    "At 0°F food stays safe indefinitely. Quality still fades over time, but it won't spoil."),
  q("kitchen-altitude-boil", KITCHEN, "High up in the mountains, water boils at a ___ temperature.", "Lower",
    ["Higher", "Same", "Random"],
    "Less air pressure means water boils sooner, so pasta and eggs take longer to cook."),

  // ---- Kitchen: measures (NIST) ----
  q("kitchen-stick-butter", KITCHEN, "One stick of butter is how many tablespoons?", "8",
    ["4", "6", "16"], "1 stick = ½ cup = 8 tablespoons = 4 ounces."),
  q("kitchen-cups-pint", KITCHEN, "How many cups are in a pint?", "2",
    ["4", "3", "8"], "2 cups = 1 pint = 16 fl oz. \"A pint's a pound the world around\" (roughly, for water)."),
  q("kitchen-cups-quart", KITCHEN, "How many cups are in a quart?", "4",
    ["2", "6", "8"], "A quart is a \"quarter\" gallon: 4 cups, or 32 fl oz."),
  q("kitchen-quarts-gallon", KITCHEN, "How many quarts are in a gallon?", "4",
    ["2", "8", "16"], "1 gallon = 4 quarts = 8 pints = 16 cups = 128 fl oz."),
  q("kitchen-oz-pound", KITCHEN, "How many ounces are in a pound?", "16",
    ["12", "10", "8"], "16 oz = 1 lb, so a quarter-pound burger is 4 oz."),
  q("kitchen-kg-pounds", KITCHEN, "One kilogram is about how many pounds?", "2.2",
    ["1.5", "3.3", "0.45"], "1 kg ≈ 2.2 lb, and 1 lb ≈ 454 g (NIST)."),
  q("kitchen-ounce-grams", KITCHEN, "One ounce is about how many grams?", "28",
    ["10", "100", "454"], "1 oz ≈ 28 g. (454 g is a whole pound.)"),
  q("kitchen-cup-ml", KITCHEN, "One US cup is about how many milliliters?", "240",
    ["100", "500", "1,000"], "NIST: 1 cup ≈ 240 mL, 1 tablespoon ≈ 15 mL, 1 teaspoon ≈ 5 mL."),
  q("kitchen-tbsp-ml", KITCHEN, "One tablespoon is about how many milliliters?", "15",
    ["5", "30", "50"], "1 tbsp ≈ 15 mL and 1 tsp ≈ 5 mL, which is why 3 tsp = 1 tbsp."),
  q("kitchen-oven-350", KITCHEN, "A recipe says 350°F. About what is that in °C?", "175°C",
    ["120°C", "250°C", "350°C"], "350°F ≈ 175–180°C, the most common baking temperature."),

  // ---- Home & DIY (OSHA ladder rules + building basics) ----
  q("diy-ladder-4-to-1", DIY, "For a safe ladder angle, move the base out 1 foot for every ___ feet of height.", "4",
    ["2", "6", "10"], "OSHA's 4-to-1 rule: the base sits ¼ of the working length away from the wall."),
  q("diy-ladder-3ft-above", DIY, "A ladder used to climb onto a roof should extend past the edge by at least…", "3 feet",
    ["6 inches", "1 foot", "6 feet"], "OSHA: at least 3 feet above the landing, so you have something to hold when stepping off."),
  q("diy-ladder-3-points", DIY, "How many points of contact should you keep while climbing a ladder?", "3",
    ["1", "2", "4"], "Two hands and a foot, or two feet and a hand, at all times (OSHA)."),
  q("diy-ladder-top-rungs", DIY, "On a straight or extension ladder, don't stand on the top ___ rungs.", "3",
    ["1", "5", "0"], "OSHA says to stay off the top three rungs, where the ladder is least stable."),
  q("diy-2x4-size", DIY, "A \"2×4\" board actually measures about…", "1½ × 3½ in.",
    ["2 × 4 in.", "1¾ × 3¾ in.", "2½ × 4½ in."], "Lumber is named by its rough-cut size, then dried and planed down."),
  q("diy-plywood-sheet", DIY, "A standard sheet of plywood or drywall is…", "4 × 8 ft",
    ["3 × 6 ft", "4 × 10 ft", "5 × 5 ft"], "4 × 8 ft = 32 sq ft per sheet, and it lines up with 16-inch stud spacing."),
  q("diy-cubic-yard", DIY, "How many cubic feet are in a cubic yard (of concrete or mulch)?", "27",
    ["9", "3", "36"], "3 ft × 3 ft × 3 ft = 27 cubic feet. Bulk materials are sold by the cubic yard."),
  q("diy-acre", DIY, "An acre is about how many square feet?", "43,560",
    ["10,000", "5,280", "100,000"], "43,560 sq ft, roughly an American football field without the end zones."),
  q("diy-drain-slope", DIY, "Household drain pipes typically slope about how much per foot?", "¼ inch",
    ["1 inch", "2 inches", "None, they're level"], "About ¼ in. per foot, steep enough to drain but slow enough to carry solids."),
  q("diy-watts-formula", DIY, "Watts equal volts times…", "Amps",
    ["Ohms", "Hertz", "Joules"], "Power (W) = voltage (V) × current (A)."),
  q("diy-15-amp-circuit", DIY, "A 15-amp, 120-volt household circuit can supply at most about…", "1,800 watts",
    ["150 watts", "500 watts", "15,000 watts"], "120 V × 15 A = 1,800 W. Two space heaters on one circuit can trip it."),

  // ---- Money ----
  q("money-up-down-50", MONEY, "An investment goes up 50%, then down 50%. Overall you are…", "Down 25%",
    ["Even", "Up 25%", "Down 50%"], "$100 → $150 → $75. Percent changes don't cancel out."),
  q("money-30-vs-15-year", MONEY, "Same home loan and rate: a 30-year mortgage costs ___ total interest than a 15-year.", "More",
    ["Less", "About the same", "Exactly half"], "Lower monthly payments, but you pay interest for twice as long."),
  q("money-percent-of-percent", MONEY, "A price is cut 20%, then another 20%. The total discount is…", "36%",
    ["40%", "20%", "44%"], "$100 → $80 → $64. The second 20% comes off the already-lower price."),

  // ---- Navigation ----
  q("nav-north-star", NAV, "Which star stays nearly fixed above the North Pole?", "Polaris",
    ["Sirius", "Vega", "Betelgeuse"], "Follow the two \"pointer\" stars at the end of the Big Dipper's cup to find it."),
  q("nav-noon-sun", NAV, "From the US at midday, the sun is roughly due…", "South",
    ["North", "East", "West"], "North of the tropics, the midday sun is always in the southern sky."),
  q("nav-time-zone-width", NAV, "Each time zone is about how many degrees of longitude wide?", "15°",
    ["10°", "24°", "30°"], "360° ÷ 24 hours = 15° per hour of time."),
  q("nav-degree-latitude", NAV, "One degree of latitude is roughly how many miles?", "69",
    ["10", "24", "360"], "About 69 miles (111 km). Handy for reading map grids."),
  q("nav-contour-lines", NAV, "On a topographic map, contour lines bunched close together mean…", "Steep ground",
    ["Flat ground", "A river", "A road"], "Each line is a step in elevation. Lines close together mean a big climb over a short distance."),
  q("nav-usgs-scale", NAV, "On a standard 1:24,000 USGS topo map, 1 inch equals…", "2,000 feet",
    ["1 mile", "24,000 feet", "100 feet"], "24,000 inches = 2,000 ft. About 2½ inches on the map is a mile."),
  q("nav-moss-myth", NAV, "Moss growing on trees reliably points…", "Nowhere: it's a myth",
    ["North", "South", "East"], "Moss grows wherever it's shady and damp. Use the sun, the stars, or a compass instead."),

  // ---- Safety (NOAA/NWS, AHA) ----
  q("safety-lightning-divide", SAFETY, "Count the seconds from lightning to thunder, then divide by ___ to get miles.", "5",
    ["2", "3", "10"], "Sound travels about a mile every 5 seconds (NOAA). For kilometers, divide by 3."),
  q("safety-hear-thunder", SAFETY, "If you can hear thunder, you are…", "Close enough to be struck",
    ["Safe if it isn't raining", "At least 20 miles away", "Safe under a tree"],
    "Thunder carries about 10 miles, and lightning can strike that far out. Go indoors (NWS)."),
  q("safety-flood-car", SAFETY, "About how much moving floodwater can sweep away most cars?", "1 foot",
    ["3 feet", "5 feet", "10 feet"], "NWS: 12 inches of moving water can float a car, and 6 inches can knock you down. Turn around, don't drown."),
  q("safety-cpr-rate", SAFETY, "Hands-only CPR: about how many chest compressions per minute?", "100–120",
    ["30–40", "60–80", "150–180"], "About the beat of \"Stayin' Alive\" (American Heart Association)."),
  q("safety-cpr-depth", SAFETY, "In adult CPR, how deep should each chest compression be?", "About 2 inches",
    ["About ½ inch", "About 4 inches", "About 6 inches"], "Push hard and fast, at least 2 in. deep, and let the chest come all the way back up."),
  q("safety-heart-rate", SAFETY, "A normal adult resting heart rate is…", "60–100 bpm",
    ["30–50 bpm", "110–150 bpm", "150–200 bpm"], "Fit athletes can sit lower. Count your pulse for 15 seconds and multiply by 4."),
  q("safety-fever", SAFETY, "A fever generally starts at about…", "100.4°F",
    ["98.6°F", "99.0°F", "104°F"], "98.6°F is the classic \"normal\". 100.4°F (38°C) is the usual fever line."),

  // ---- Measurement ----
  q("measure-meter-feet", MEASURE, "One meter is about how many feet?", "3.3",
    ["1.6", "2.5", "10"], "1 m ≈ 3.28 ft, a little longer than a yard."),
  q("measure-liter-quart", MEASURE, "A liter is just a little more than a…", "Quart",
    ["Cup", "Pint", "Gallon"], "1 L ≈ 1.06 quarts, so a 2-liter bottle is about half a gallon."),
  q("measure-yard-inches", MEASURE, "How many inches are in a yard?", "36",
    ["12", "24", "48"], "3 feet × 12 inches = 36 inches."),
  q("measure-ton-pounds", MEASURE, "A US (short) ton is how many pounds?", "2,000",
    ["1,000", "2,240", "5,000"], "2,000 lb. The British \"long\" ton is 2,240 lb."),
  q("measure-pizza-area", MEASURE, "A 16-inch pizza has how much more area than an 8-inch pizza?", "4 times",
    ["2 times", "3 times", "8 times"], "Area grows with the square: double the width, four times the pizza (πr²)."),
];

// ---------- templates ----------

function lightningDistance(): OriginalQuestion[] {
  return [5, 10, 15, 20, 30, 40].map((s) => {
    const miles = s / 5;
    const label = (m: number) => `${frac(m)} mile${m <= 1 ? "" : "s"}`;
    return q(`safety-lightning-distance:${s}`, SAFETY,
      `You count ${s} seconds between the flash and the thunder. How far away was the lightning?`,
      label(miles), pick(label(miles), [label(miles * 2), label(s), label(miles / 2), label(miles + 1)]),
      `Divide by 5: ${s} ÷ 5 = ${frac(miles)}. Anything under 10 miles is close enough to strike you.`);
  });
}

function ladderBase(): OriginalQuestion[] {
  return [8, 12, 16, 20, 24, 28].map((h) => {
    const base = h / 4;
    const ft = (n: number) => `${frac(n)} ft`;
    return q(`diy-ladder-base:${h}`, DIY,
      `Your ladder touches the wall ${h} ft up. How far from the wall should its feet be?`,
      ft(base), pick(ft(base), [ft(h / 2), ft(base + 2), ft(base - 1), ft(base + 1), ft(h / 8), ft(h)]),
      `4-to-1 rule: ${h} ÷ 4 = ${frac(base)} ft out from the wall.`);
  });
}

function fuelCost(): OriginalQuestion[] {
  const trips: [miles: number, mpg: number, price: number][] = [
    [300, 30, 3], [240, 30, 4], [200, 25, 3], [150, 30, 3], [400, 20, 3],
  ];
  return trips.map(([miles, mpg, price]) => {
    const gallons = miles / mpg;
    const cost = gallons * price;
    return q(`travel-fuel-cost:${miles}-${mpg}-${price}`, TRAVEL,
      `A ${miles}-mile trip, a car that gets ${mpg} mpg, gas at ${money(price)}/gal. About what's the fuel cost?`,
      money(cost), pick(money(cost), [money(gallons), money(cost + 10), money(cost * 2), money(cost - 5)]),
      `${miles} ÷ ${mpg} = ${gallons} gallons, × ${money(price)} = ${money(cost)}.`);
  });
}

function travelTime(): OriginalQuestion[] {
  const trips: [miles: number, mph: number][] = [[120, 60], [150, 50], [90, 60], [200, 40], [45, 30]];
  const hrs = (h: number) => `${frac(h)} hour${h === 1 ? "" : "s"}`;
  return trips.map(([miles, mph]) => {
    const h = miles / mph;
    return q(`travel-time:${miles}-${mph}`, TRAVEL,
      `How long does a ${miles}-mile drive take at ${mph} mph?`,
      hrs(h), pick(hrs(h), [hrs(h + 1), hrs(h + 0.5), hrs(h * 2), hrs(Math.max(0.5, h - 0.5))]),
      `Time = distance ÷ speed: ${miles} ÷ ${mph} = ${frac(h)} hours.`);
  });
}

function unitPrice(): OriginalQuestion[] {
  const deals: [aOz: number, aPrice: number, bOz: number, bPrice: number][] = [
    [12, 3.0, 16, 3.6], [10, 2.5, 20, 5.5], [8, 2.0, 24, 6.0], [32, 4.0, 64, 7.0], [6, 1.5, 18, 4.95],
  ];
  const cents = (n: number) => `${Math.round(n * 1000) / 10}¢`;
  return deals.map(([aOz, aPrice, bOz, bPrice]) => {
    const a = aPrice / aOz;
    const b = bPrice / bOz;
    const A = `The ${aOz} oz`;
    const B = `The ${bOz} oz`;
    const SAME = "Same price per ounce";
    const correct = Math.abs(a - b) < 1e-9 ? SAME : a < b ? A : B;
    return q(`money-unit-price:${aOz}-${aPrice}-${bOz}-${bPrice}`, MONEY,
      `Which is the better deal: ${aOz} oz for ${money(aPrice)} or ${bOz} oz for ${money(bPrice)}?`,
      correct, pick(correct, [A, B, SAME, "Can't tell without the brand"]),
      `Per ounce: ${cents(a)} vs ${cents(b)}. Check the unit price on the shelf tag. Bigger isn't always cheaper.`);
  });
}

function salesTax(): OriginalQuestion[] {
  const items: [price: number, pct: number][] = [[40, 5], [20, 10], [50, 8], [80, 5], [100, 7]];
  return items.map(([price, pct]) => {
    const tax = (price * pct) / 100;
    const total = price + tax;
    return q(`money-sales-tax:${price}-${pct}`, MONEY,
      `Something costs ${money(price)} and sales tax is ${pct}%. What's the total?`,
      money(total), pick(money(total), [money(price + pct), money(tax), money(total + 1), money(price * (1 + pct / 10))]),
      `${pct}% of ${money(price)} is ${money(tax)}, so the total is ${money(total)}.`);
  });
}

function floorArea(): OriginalQuestion[] {
  const rooms: [number, number][] = [[10, 12], [8, 10], [12, 12], [9, 12], [15, 10]];
  return rooms.map(([a, b]) => {
    const area = a * b;
    const sq = (n: number) => `${n} sq ft`;
    return q(`diy-floor-area:${a}x${b}`, DIY,
      `A room is ${a} × ${b} ft. How much flooring do you need?`,
      sq(area), pick(sq(area), [sq(2 * (a + b)), sq(area + 10), sq(area - 10), sq(a + b)]),
      `Area = length × width: ${a} × ${b} = ${area} sq ft. Buy about 10% extra for cuts.`);
  });
}

function paintGallons(): OriginalQuestion[] {
  return [350, 700, 1050, 1400].map((wall) => {
    const gal = wall / 350;
    const g = (n: number) => `${n} gallon${n === 1 ? "" : "s"}`;
    return q(`diy-paint-gallons:${wall}`, DIY,
      `You have ${wall.toLocaleString("en-US")} sq ft of wall. A gallon covers about 350 sq ft. Gallons for one coat?`,
      g(gal), pick(g(gal), [g(gal + 1), g(gal * 2), g(Math.max(1, gal - 1)), g(gal + 2), g(gal + 3), g(gal * 3)]),
      `${wall.toLocaleString("en-US")} ÷ 350 = ${gal}. Double it for two coats.`);
  });
}

export const everyday: OriginalQuestion[] = [
  ...fixed,
  ...lightningDistance(),
  ...ladderBase(),
  ...fuelCost(),
  ...travelTime(),
  ...unitPrice(),
  ...salesTax(),
  ...floorArea(),
  ...paintGallons(),
];
