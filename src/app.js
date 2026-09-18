import { analyzeDesign, powerForTotalN } from "./power.js";

const $ = (id) => document.getElementById(id);
const ids = {
  baseline: ["baselineRange","baselineNumber"],
  effect: ["effectRange","effectNumber"],
  power: ["powerRange","powerNumber"],
  alpha: ["alphaRange","alphaNumber"],
  allocation: ["allocationRange","allocationNumber"],
  attrition: ["attritionRange","attritionNumber"]
};

const defaults = {
  baseline:10, effect:20, power:80, alpha:5, allocation:50, attrition:5, available:5000, mode:"relative"
};

function pair(name, min, max) {
  const [rangeId, numberId] = ids[name];
  const range = $(rangeId), number = $(numberId);
  const sync = (from, to) => {
    let v = Number(from.value);
    if (!Number.isFinite(v)) return;
    v = Math.min(max, Math.max(min, v));
    to.value = v;
    render();
  };
  range.addEventListener("input", () => sync(range, number));
  number.addEventListener("input", () => sync(number, range));
}

pair("baseline",0.5,80);
pair("effect",0.1,100);
pair("power",50,99);
pair("alpha",1,20);
pair("allocation",10,90);
pair("attrition",0,50);

$("availableSample").addEventListener("input", render);
document.querySelectorAll('input[name="effectMode"]').forEach(el => el.addEventListener("change", () => {
  const absolute = el.checked && el.value === "absolute";
  if (absolute) {
    $("effectRange").max = "20"; $("effectRange").step = "0.1";
    $("effectNumber").max = "20"; $("effectNumber").step = "0.1";
    if (Number($("effectNumber").value) > 20) $("effectNumber").value = $("effectRange").value = 2;
    $("effectSuffix").textContent = "pp";
  } else if (el.checked) {
    $("effectRange").max = "100"; $("effectRange").step = "1";
    $("effectNumber").max = "100"; $("effectNumber").step = "1";
    $("effectSuffix").textContent = "%";
  }
  render();
}));

$("resetButton").addEventListener("click", () => {
  $("baselineRange").value = $("baselineNumber").value = defaults.baseline;
  $("effectRange").value = $("effectNumber").value = defaults.effect;
  $("powerRange").value = $("powerNumber").value = defaults.power;
  $("alphaRange").value = $("alphaNumber").value = defaults.alpha;
  $("allocationRange").value = $("allocationNumber").value = defaults.allocation;
  $("attritionRange").value = $("attritionNumber").value = defaults.attrition;
  $("availableSample").value = defaults.available;
  document.querySelector('input[name="effectMode"][value="relative"]').checked = true;
  $("effectRange").max = "100"; $("effectNumber").max = "100";
  $("effectRange").step = $("effectNumber").step = "1";
  $("effectSuffix").textContent = "%";
  render();
});

function fmt(n) { return Math.round(n).toLocaleString(); }
function pct(v, digits=1) { return (v * 100).toFixed(digits) + "%"; }

function currentInputs() {
  const mode = document.querySelector('input[name="effectMode"]:checked').value;
  return {
    baseline: Number($("baselineNumber").value),
    effectValue: Number($("effectNumber").value),
    effectMode: mode,
    alphaPct: Number($("alphaNumber").value),
    powerPct: Number($("powerNumber").value),
    treatmentPct: Number($("allocationNumber").value),
    availableSample: Number($("availableSample").value),
    attritionPct: Number($("attritionNumber").value)
  };
}

function validate(v) {
  const p1 = v.effectMode === "relative"
    ? (v.baseline/100) * (1 + v.effectValue/100)
    : (v.baseline + v.effectValue)/100;
  if (!(v.baseline > 0 && v.baseline < 100)) return "Baseline must be between 0% and 100%.";
  if (!(p1 > 0 && p1 < 1)) return "The implied treatment conversion rate must stay between 0% and 100%.";
  if (!(v.availableSample >= 10)) return "Available sample must be at least 10 units.";
  return "";
}

function render() {
  const v = currentInputs();
  const error = validate(v);
  $("validationMessage").hidden = !error;
  $("validationMessage").textContent = error;
  if (error) return;

  const r = analyzeDesign(v);
  if (r.error) {
    $("validationMessage").hidden = false;
    $("validationMessage").textContent = r.error;
    return;
  }

  $("requiredStarting").textContent = fmt(r.startingN);
  $("requiredAnalyzable").textContent = fmt(r.requiredAnalyzable);
  $("controlN").textContent = fmt(r.controlN);
  $("treatmentN").textContent = fmt(r.treatmentN);
  $("treatmentRate").textContent = pct(r.p1);
  $("achievedPower").textContent = pct(r.achievedPower, 1);

  const liftText = v.effectMode === "relative"
    ? v.effectValue + "% relative lift"
    : v.effectValue + " percentage-point lift";
  $("designSummary").textContent =
    `To detect a ${liftText} from a ${v.baseline}% baseline with ${v.powerPct}% power at α = ${v.alphaPct}%, recruit about ${fmt(r.startingN)} units after accounting for ${v.attritionPct}% attrition.`;

  const badge = $("statusBadge");
  badge.textContent = r.feasible ? "Feasible with available sample" : "Underpowered at available sample";
  badge.className = "status-badge " + (r.feasible ? "good" : "warn");

  const delta = Math.abs(v.availableSample - r.startingN);
  $("availabilitySummary").textContent = r.feasible
    ? `Your available sample of ${fmt(v.availableSample)} is about ${fmt(delta)} above the recruitment target.`
    : `Your available sample of ${fmt(v.availableSample)} is about ${fmt(delta)} below the recruitment target. Either increase sample size, accept a larger MDE, or revisit the target power/alpha assumptions.`;

  drawChart(r);
}

function drawChart(r) {
  const canvas = $("powerChart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 700;
  const cssHeight = 320;
  canvas.width = cssWidth * dpr; canvas.height = cssHeight * dpr;
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,cssWidth,cssHeight);

  const pad = {l:52,r:20,t:18,b:42};
  const w = cssWidth-pad.l-pad.r, h = cssHeight-pad.t-pad.b;
  const maxN = Math.max(r.requiredAnalyzable*1.6, r.analyzableAvailable*1.15, 100);
  const steps = 60;
  const points = [];
  for (let i=0;i<=steps;i++) {
    const n = Math.max(4, Math.round((i/steps)*maxN));
    const p = powerForTotalN({totalN:n,p0:r.p0,p1:r.p1,alpha:r.alpha,treatmentShare:r.treatmentShare});
    points.push([n,p]);
  }

  const styles = getComputedStyle(document.documentElement);
  const grid = styles.getPropertyValue("--grid").trim() || "#d8dde6";
  const text = styles.getPropertyValue("--muted").trim() || "#667085";
  const curve = styles.getPropertyValue("--curve").trim() || "#2557d6";
  const target = styles.getPropertyValue("--target").trim() || "#9a6700";

  ctx.strokeStyle=grid; ctx.lineWidth=1;
  ctx.fillStyle=text; ctx.font="12px system-ui";
  [0,.25,.5,.75,1].forEach(y=>{
    const py=pad.t+h*(1-y);
    ctx.beginPath();ctx.moveTo(pad.l,py);ctx.lineTo(pad.l+w,py);ctx.stroke();
    ctx.fillText(Math.round(y*100)+"%",8,py+4);
  });

  const ty=pad.t+h*(1-r.targetPower);
  ctx.strokeStyle=target;ctx.setLineDash([6,5]);ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(pad.l,ty);ctx.lineTo(pad.l+w,ty);ctx.stroke();ctx.setLineDash([]);

  ctx.strokeStyle=curve;ctx.lineWidth=3;ctx.beginPath();
  points.forEach(([n,p],i)=>{
    const x=pad.l+w*(n/maxN), y=pad.t+h*(1-p);
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });ctx.stroke();

  const reqX=pad.l+w*(r.requiredAnalyzable/maxN);
  ctx.fillStyle=curve;ctx.beginPath();ctx.arc(reqX,ty,5,0,Math.PI*2);ctx.fill();

  ctx.fillStyle=text;
  const ticks=[0,.25,.5,.75,1];
  ticks.forEach(t=>{
    const x=pad.l+w*t;
    const label=fmt(maxN*t);
    ctx.fillText(label,x-ctx.measureText(label).width/2,cssHeight-14);
  });

  $("chartDescription").textContent =
    `The curve shows approximate statistical power as analyzable sample size increases. Target power is reached at about ${fmt(r.requiredAnalyzable)} analyzable units.`;
}

window.addEventListener("resize", render);
render();
