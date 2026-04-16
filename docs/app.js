// AI Court Rules Tracker — dashboard
// Pure vanilla JS. Loads ../data/rules.json and ../data/history.json,
// renders a US state choropleth (D3 + us-atlas), a search-filtered table,
// a category legend that doubles as a filter, and a trend chart (Chart.js).

const STATE_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const RULES_URL = "../data/rules.json";
const HISTORY_URL = "../data/history.json";

const state = {
  rules: [],
  categories: {},
  history: null,
  activeTab: "federal",          // "federal" | "state"
  activeCategories: new Set(),   // empty = show all
  searchTerm: "",
  selectedState: null,           // two-letter postal code
  topology: null,
  trendChart: null,
};

// --------- bootstrap ---------
async function init() {
  const [rulesResp, historyResp, topo] = await Promise.all([
    fetch(RULES_URL).then(r => r.json()),
    fetch(HISTORY_URL).then(r => r.json()).catch(() => null),
    fetch(STATE_TOPOJSON_URL).then(r => r.json()),
  ]);
  state.rules = rulesResp.rules || [];
  state.categories = rulesResp.categories || {};
  state.history = historyResp;
  state.topology = topo;

  document.getElementById("last-updated").textContent = rulesResp.last_updated || "—";
  document.getElementById("total-rules").textContent = state.rules.length;

  renderLegend();
  bindTabs();
  bindSearch();
  renderAll();
}

// --------- rendering ---------
function activeRules() {
  let rs = state.rules.filter(r => r.jurisdiction === state.activeTab);
  if (state.activeCategories.size > 0) {
    rs = rs.filter(r => state.activeCategories.has(r.category));
  }
  if (state.searchTerm.trim()) {
    const q = state.searchTerm.toLowerCase();
    rs = rs.filter(r => {
      const hay = [r.court, r.court_short, r.judge, r.state, r.title, r.summary, r.category, r.rule_type, r.circuit]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  return rs;
}

function renderAll() {
  renderMap();
  renderDetail();
  renderTable();
  renderTrend();
}

function renderLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = "";
  const sorted = Object.entries(state.categories).sort((a, b) => a[1].order - b[1].order);
  for (const [slug, cat] of sorted) {
    const btn = document.createElement("button");
    btn.className = "legend-item" + (state.activeCategories.has(slug) ? " active" : "");
    btn.innerHTML = `<span class="legend-swatch" style="background:${cat.color}"></span><span>${cat.label}</span>`;
    btn.title = cat.description;
    btn.addEventListener("click", () => {
      if (state.activeCategories.has(slug)) state.activeCategories.delete(slug);
      else state.activeCategories.add(slug);
      renderLegend();
      renderAll();
    });
    el.appendChild(btn);
  }
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      b.classList.add("active");
      b.setAttribute("aria-selected", "true");
      state.activeTab = b.dataset.tab;
      state.selectedState = null;
      renderAll();
    });
  });
}

function bindSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", e => {
    state.searchTerm = e.target.value;
    renderAll();
  });
}

// strictest = lowest .order
function strictestCategoryForState(stateCode) {
  const rs = activeRules().filter(r => r.state === stateCode);
  if (rs.length === 0) return null;
  let strictest = null;
  for (const r of rs) {
    const cat = state.categories[r.category];
    if (!cat) continue;
    if (!strictest || cat.order < strictest.order) strictest = { ...cat, slug: r.category };
  }
  return strictest;
}

// FIPS -> state postal map (for us-atlas)
const FIPS_TO_POSTAL = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
  "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
  "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
  "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"
};
const POSTAL_TO_NAME = {
  "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut",
  "DE":"Delaware","DC":"District of Columbia","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois",
  "IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland",
  "MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana",
  "NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York",
  "NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania",
  "RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah",
  "VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"
};

function renderMap() {
  const svg = d3.select("#us-map");
  svg.selectAll("*").remove();
  if (!state.topology) return;

  const states = topojson.feature(state.topology, state.topology.objects.states);
  const projection = d3.geoAlbersUsa().fitSize([960, 600], states);
  const path = d3.geoPath(projection);

  const g = svg.append("g");

  g.selectAll("path.state")
    .data(states.features)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", d => {
      const fips = String(d.id).padStart(2, "0");
      const postal = FIPS_TO_POSTAL[fips];
      const cat = strictestCategoryForState(postal);
      return cat ? cat.color : "#f1f5f9";
    })
    .attr("data-postal", d => FIPS_TO_POSTAL[String(d.id).padStart(2, "0")] || "")
    .classed("no-data", d => {
      const postal = FIPS_TO_POSTAL[String(d.id).padStart(2, "0")];
      return !strictestCategoryForState(postal);
    })
    .classed("selected", d => state.selectedState === FIPS_TO_POSTAL[String(d.id).padStart(2, "0")])
    .on("click", (event, d) => {
      const postal = FIPS_TO_POSTAL[String(d.id).padStart(2, "0")];
      state.selectedState = state.selectedState === postal ? null : postal;
      renderMap();
      renderDetail();
    })
    .append("title")
    .text(d => {
      const postal = FIPS_TO_POSTAL[String(d.id).padStart(2, "0")];
      const cat = strictestCategoryForState(postal);
      const name = POSTAL_TO_NAME[postal] || "";
      const count = activeRules().filter(r => r.state === postal).length;
      if (!cat) return `${name}: no tracked rules`;
      return `${name}\nStrictest rule in force: ${cat.label}\nRules in this state: ${count}`;
    });
}

function renderDetail() {
  const titleEl = document.getElementById("detail-title");
  const bodyEl = document.getElementById("detail-body");
  if (!state.selectedState) {
    titleEl.textContent = state.activeTab === "federal" ? "Click a state to see federal-court rules in force there" : "Click a state to see state-court rules";
    bodyEl.innerHTML = `<p class="muted">Hover over a state to preview the strictest rule currently in force; click to see the full list of orders for that jurisdiction.</p>`;
    return;
  }
  const stateName = POSTAL_TO_NAME[state.selectedState] || state.selectedState;
  const rs = activeRules().filter(r => r.state === state.selectedState);
  titleEl.textContent = `${stateName} — ${rs.length} rule${rs.length === 1 ? "" : "s"}`;
  if (rs.length === 0) {
    bodyEl.innerHTML = `<p class="muted">No tracked ${state.activeTab}-court rules addressing AI for this jurisdiction.</p>`;
    return;
  }
  bodyEl.innerHTML = rs.map(r => ruleCardHtml(r)).join("");
}

function ruleCardHtml(r) {
  const cat = state.categories[r.category];
  const color = cat ? cat.color : "#94a3b8";
  const label = cat ? cat.label : r.category;
  const pending = r.last_verified == null ? `<span class="pending-flag" title="Hand-seeded; awaiting agent verification">unverified</span>` : "";
  const courtBits = [r.court_short || r.court, r.judge].filter(Boolean).join(" — ");
  const link = r.source_pdf || r.source_url;
  return `
    <div class="detail-rule" style="border-left-color:${color}">
      <h3>${escapeHtml(r.title || r.id)} ${pending}</h3>
      <div class="meta-row">${escapeHtml(courtBits)} &middot; ${escapeHtml(r.effective_date || "date unknown")} &middot; ${escapeHtml(r.rule_type || "")}</div>
      <div><span class="category-pill" style="background:${color}">${escapeHtml(label)}</span></div>
      <p class="summary">${escapeHtml(r.summary || "")}</p>
      ${link ? `<p class="meta-row"><a href="${escapeAttr(link)}" target="_blank" rel="noopener">Source &rarr;</a></p>` : ""}
    </div>`;
}

function renderTable() {
  const rs = activeRules();
  document.getElementById("visible-count").textContent = `(${rs.length} shown)`;
  const tbody = document.querySelector("#rules-table tbody");
  if (rs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:1rem;">No rules match the current filters.</td></tr>`;
    return;
  }
  tbody.innerHTML = rs.map(r => {
    const cat = state.categories[r.category];
    const color = cat ? cat.color : "#94a3b8";
    const label = cat ? cat.label : r.category;
    const link = r.source_pdf || r.source_url;
    return `
      <tr class="row-tinted" style="border-left-color:${color}">
        <td>${escapeHtml(r.effective_date || "")}</td>
        <td>${escapeHtml(r.court_short || r.court || "")}<br><span class="muted">${escapeHtml(r.state || r.circuit || "")}</span></td>
        <td>${escapeHtml(r.judge || "—")}</td>
        <td>${escapeHtml((r.rule_type || "").replace(/_/g, " "))}</td>
        <td class="category-cell"><span class="category-pill" style="background:${color}">${escapeHtml(label)}</span></td>
        <td>${escapeHtml(r.summary || "")}</td>
        <td>${link ? `<a href="${escapeAttr(link)}" target="_blank" rel="noopener">link</a>` : "—"}</td>
      </tr>`;
  }).join("");
}

function renderTrend() {
  const ctx = document.getElementById("trend-chart");
  if (!state.history || !state.history.snapshots || state.history.snapshots.length === 0) {
    ctx.replaceWith(Object.assign(document.createElement("p"), { className: "muted", textContent: "No history yet — the trend chart will populate as the agent runs over time." }));
    return;
  }
  const snaps = state.history.snapshots;
  const labels = snaps.map(s => s.date);
  const cats = Object.entries(state.categories).sort((a, b) => a[1].order - b[1].order);
  const datasets = cats.map(([slug, cat]) => ({
    label: cat.label,
    data: snaps.map(s => (s.by_category && s.by_category[slug]) || 0),
    backgroundColor: cat.color,
    borderColor: cat.color,
    fill: true,
  }));
  if (state.trendChart) state.trendChart.destroy();
  state.trendChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } } },
      scales: { y: { stacked: true, beginAtZero: true, title: { display: true, text: "Cumulative rules" } } },
      elements: { line: { tension: 0.2 } },
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

init().catch(err => {
  console.error(err);
  document.querySelector("main").innerHTML = `<div style="padding:2rem; color:#7f1d1d; background:#fee2e2; border-radius:8px;"><strong>Failed to load dashboard data.</strong> ${escapeHtml(err.message)}</div>`;
});
