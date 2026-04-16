// AI Court Rules Tracker — dashboard
// Pure vanilla JS. Loads ../data/rules.json and ../data/news.json,
// renders a US state choropleth (D3 + us-atlas), a search-filtered table,
// a category legend that doubles as a filter, and a trend chart (Chart.js)
// computed directly from each rule's effective_date.

const STATE_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const RULES_URL = "../data/rules.json";
const NEWS_URL = "../data/news.json";

const state = {
  rules: [],
  categories: {},
  news: { articles: [], tag_vocabulary: {} },
  activeTab: "federal",          // "federal" | "state" | "news"
  activeCategories: new Set(),   // empty = show all
  activeTags: new Set(),         // for News tab
  searchTerm: "",
  selectedState: null,           // two-letter postal code
  topology: null,
  trendChart: null,
  lastUpdated: null,             // Date object
};

// --------- bootstrap ---------
async function init() {
  const [rulesResp, newsResp, topo] = await Promise.all([
    fetch(RULES_URL).then(r => r.json()),
    fetch(NEWS_URL).then(r => r.json()).catch(() => ({ articles: [], tag_vocabulary: {} })),
    fetch(STATE_TOPOJSON_URL).then(r => r.json()),
  ]);
  state.rules = rulesResp.rules || [];
  state.categories = rulesResp.categories || {};
  state.news = newsResp;
  state.topology = topo;

  // Pick the most recent of rules / news last_updated as the site-wide timestamp.
  const stamps = [rulesResp.last_updated, newsResp.last_updated].filter(Boolean).map(s => new Date(s));
  state.lastUpdated = stamps.length ? new Date(Math.max(...stamps.map(d => d.getTime()))) : null;

  document.getElementById("total-rules").textContent = state.rules.length;
  document.getElementById("total-news").textContent = (state.news.articles || []).length;

  renderLastUpdated();
  // Keep the relative timestamp fresh without a page reload.
  setInterval(renderLastUpdated, 60_000);

  renderLegend();
  renderTagLegend();
  bindTabs();
  bindSearch();
  renderAll();
}

function renderLastUpdated() {
  const absEl = document.getElementById("last-updated");
  const relEl = document.getElementById("last-updated-relative");
  if (!state.lastUpdated) {
    absEl.textContent = "—";
    absEl.title = "";
    relEl.textContent = "";
    return;
  }
  const d = state.lastUpdated;
  const abs = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  absEl.textContent = abs;
  absEl.title = d.toISOString();
  relEl.textContent = "(" + relativeTime(d) + ")";
}

function relativeTime(d) {
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + " min ago";
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + " hr ago";
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "yesterday";
  if (days < 30) return days + " days ago";
  const months = Math.floor(days / 30);
  if (months < 12) return months + " mo ago";
  return Math.floor(days / 365) + " yr ago";
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
  applyTabVisibility();
  if (state.activeTab === "news") {
    renderNews();
  } else {
    renderMap();
    renderDetail();
    renderTable();
    renderTrend();
  }
}

function applyTabVisibility() {
  const isNews = state.activeTab === "news";
  document.getElementById("map-panel").hidden = isNews;
  document.getElementById("trend-panel").hidden = isNews;
  document.getElementById("table-panel").hidden = isNews;
  document.getElementById("news-panel").hidden = !isNews;
  document.getElementById("legend").hidden = isNews;
  document.getElementById("tag-legend").hidden = !isNews;
  const searchEl = document.getElementById("search");
  searchEl.placeholder = isNews
    ? "Search news (headline, publication, summary, tag)\u2026"
    : "Search court, judge, state, keyword\u2026";
}

function renderLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = "";
  const sorted = Object.entries(state.categories).sort((a, b) => a[1].order - b[1].order);
  for (const [slug, cat] of sorted) {
    const btn = document.createElement("button");
    btn.className = "legend-item" + (state.activeCategories.has(slug) ? " active" : "");
    btn.innerHTML = `<span class="legend-swatch" style="background:${cat.color}"></span><span>${escapeHtml(cat.label)}</span>`;
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

function renderTagLegend() {
  const el = document.getElementById("tag-legend");
  el.innerHTML = "";
  const vocab = state.news.tag_vocabulary || {};
  const slugs = Object.keys(vocab);
  if (slugs.length === 0) {
    el.innerHTML = `<span class="muted" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">News tags appear once articles are indexed.</span>`;
    return;
  }
  for (const slug of slugs) {
    const btn = document.createElement("button");
    btn.className = "legend-item" + (state.activeTags.has(slug) ? " active" : "");
    btn.innerHTML = `<span>${escapeHtml(vocab[slug].label || slug)}</span>`;
    btn.title = vocab[slug].description || "";
    btn.addEventListener("click", () => {
      if (state.activeTags.has(slug)) state.activeTags.delete(slug);
      else state.activeTags.add(slug);
      renderTagLegend();
      renderNews();
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
  const pending = r.last_verified == null ? `<span class="pending-flag" title="Not yet reconciled against the primary source">unverified</span>` : "";
  const courtBits = [r.court_short || r.court, r.judge].filter(Boolean).join(" — ");
  const link = r.source_pdf || r.source_url;
  const summary = r.summary || "";
  const isQuote = isQuotedExcerpt(summary);
  const summaryCls = isQuote ? "summary" : "summary plain";
  return `
    <div class="detail-rule" style="border-left-color:${color}">
      <h3>${escapeHtml(r.title || r.id)} ${pending}</h3>
      <div class="meta-row">${escapeHtml(courtBits)} &middot; ${escapeHtml(r.effective_date || "date unknown")} &middot; ${escapeHtml(r.rule_type || "")}</div>
      <div><span class="category-pill" style="background:${color}">${escapeHtml(label)}</span></div>
      ${isQuote
        ? `<blockquote class="${summaryCls}">${escapeHtml(summary)}</blockquote>`
        : `<p class="${summaryCls}">${escapeHtml(summary)}</p>`}
      ${link ? `<p class="meta-row"><a href="${escapeAttr(link)}" target="_blank" rel="noopener">Source &rarr;</a></p>` : ""}
    </div>`;
}

// A summary rendered as an italic blockquote if it opens with a quotation mark
// (indicating the agent populated it as a direct excerpt from the order).
function isQuotedExcerpt(s) {
  if (!s) return false;
  const first = s.trim().charAt(0);
  return first === "\"" || first === "\u201C"; // straight or curly open-quote
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
    const summary = r.summary || "";
    const summaryCls = isQuotedExcerpt(summary) ? "summary-cell" : "summary-cell plain";
    return `
      <tr class="row-tinted" style="border-left-color:${color}">
        <td>${escapeHtml(r.effective_date || "")}</td>
        <td>${escapeHtml(r.court_short || r.court || "")}<br><span class="muted">${escapeHtml(r.state || r.circuit || "")}</span></td>
        <td>${escapeHtml(r.judge || "—")}</td>
        <td>${escapeHtml((r.rule_type || "").replace(/_/g, " "))}</td>
        <td class="category-cell"><span class="category-pill" style="background:${color}">${escapeHtml(label)}</span></td>
        <td class="${summaryCls}">${escapeHtml(summary)}</td>
        <td>${link ? `<a href="${escapeAttr(link)}" target="_blank" rel="noopener">link</a>` : "—"}</td>
      </tr>`;
  }).join("");
}

function renderTrend() {
  const ctx = document.getElementById("trend-chart");
  if (!ctx) return;

  // Consider only the currently-visible jurisdiction, and exclude superseded entries
  // so the stacked counts reflect what is actually in force.
  const inForce = state.rules.filter(r =>
    r.jurisdiction === state.activeTab &&
    !r.superseded_by &&
    r.effective_date
  );

  if (inForce.length === 0) {
    if (state.trendChart) { state.trendChart.destroy(); state.trendChart = null; }
    const parent = ctx.parentElement;
    ctx.style.display = "none";
    let placeholder = parent.querySelector(".trend-empty");
    if (!placeholder) {
      placeholder = document.createElement("p");
      placeholder.className = "muted trend-empty";
      placeholder.textContent = "No rules with an effective date are tracked yet.";
      parent.appendChild(placeholder);
    }
    return;
  }
  ctx.style.display = "";
  const placeholder = ctx.parentElement.querySelector(".trend-empty");
  if (placeholder) placeholder.remove();

  // X axis: one label per month from the earliest effective_date (or 2023-01 — whichever is earlier)
  // through the current month.
  const earliest = inForce.reduce((min, r) => r.effective_date < min ? r.effective_date : min, "9999-12-31");
  const startYM = Math.min(ym(earliest), ym("2023-01-01"));
  const now = new Date();
  const endYM = now.getUTCFullYear() * 12 + now.getUTCMonth();

  const labels = [];
  for (let m = startYM; m <= endYM; m++) {
    const y = Math.floor(m / 12);
    const mo = (m % 12) + 1;
    labels.push(`${y}-${String(mo).padStart(2, "0")}`);
  }

  const cats = Object.entries(state.categories).sort((a, b) => a[1].order - b[1].order);
  const datasets = cats.map(([slug, cat]) => {
    const rulesInCat = inForce.filter(r => r.category === slug);
    const data = labels.map(label => {
      const cutoff = label + "-31"; // anything effective on or before this month-end counts
      return rulesInCat.filter(r => r.effective_date <= cutoff).length;
    });
    return {
      label: cat.label,
      data,
      backgroundColor: cat.color,
      borderColor: cat.color,
      fill: true,
    };
  });

  if (state.trendChart) state.trendChart.destroy();
  state.trendChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } } },
      scales: {
        y: { stacked: true, beginAtZero: true, title: { display: true, text: "Cumulative rules in force" } },
        x: { ticks: { maxTicksLimit: 12, autoSkip: true } },
      },
      elements: { line: { tension: 0.2 }, point: { radius: 0 } },
    }
  });
}

// Convert an ISO date string (YYYY-MM-DD) to a month-index: year*12 + month0.
function ym(isoDate) {
  const [y, m] = isoDate.split("-");
  return parseInt(y, 10) * 12 + (parseInt(m, 10) - 1);
}

// --------- News ---------
function activeArticles() {
  let arts = (state.news.articles || []).slice();
  if (state.activeTags.size > 0) {
    arts = arts.filter(a => (a.topic_tags || []).some(t => state.activeTags.has(t)));
  }
  const q = state.searchTerm.trim().toLowerCase();
  if (q) {
    arts = arts.filter(a => {
      const hay = [a.title, a.publication, a.author, a.summary, (a.topic_tags || []).join(" ")]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  arts.sort((x, y) => String(y.published_date || "").localeCompare(String(x.published_date || "")));
  return arts;
}

function renderNews() {
  const arts = activeArticles();
  document.getElementById("news-count").textContent = `(${arts.length} article${arts.length === 1 ? "" : "s"})`;
  const list = document.getElementById("news-list");
  const hint = document.getElementById("news-empty-hint");

  if ((state.news.articles || []).length === 0) {
    hint.hidden = false;
    list.innerHTML = "";
    return;
  }
  hint.hidden = true;

  if (arts.length === 0) {
    list.innerHTML = `<p class="muted">No articles match the current filters.</p>`;
    return;
  }

  list.innerHTML = arts.map(a => {
    const vocab = state.news.tag_vocabulary || {};
    const tags = (a.topic_tags || []).map(t => {
      const label = (vocab[t] && vocab[t].label) || t;
      const cls = (t === "hallucinated_citations" || t === "sanctions") ? " incident"
               : (t === "new_standing_order" || t === "rule_update" || t === "bar_guidance") ? " policy"
               : "";
      return `<span class="news-tag${cls}">${escapeHtml(label)}</span>`;
    }).join("");
    const metaBits = [a.publication, a.author, formatDisplayDate(a.published_date)].filter(Boolean);
    const related = (a.related_rule_ids || []).length
      ? `<div class="related-rule-hint">Related tracked rule${a.related_rule_ids.length === 1 ? "" : "s"}: ${a.related_rule_ids.map(escapeHtml).join(", ")}</div>`
      : "";
    return `
      <a class="news-card" href="${escapeAttr(a.url || '#')}" target="_blank" rel="noopener">
        <h3>${escapeHtml(a.title || "(untitled)")}</h3>
        <div class="news-meta">${metaBits.map(escapeHtml).join(" \u00b7 ")}</div>
        <p class="news-summary">${escapeHtml(a.summary || "")}</p>
        <div class="news-tags">${tags}</div>
        ${related}
      </a>`;
  }).join("");
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

init().catch(err => {
  console.error(err);
  document.querySelector("main").innerHTML = `<div style="padding:2rem; color:#7f1d1d; background:#fee2e2; border-radius:8px;"><strong>Failed to load dashboard data.</strong> ${escapeHtml(err.message)}</div>`;
});
