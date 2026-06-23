const state = {
  provider: "github",
  filter: "all",
  search: "",
  selectedId: 4821,
  sourceName: "Sample telemetry",
  sourceStatus: "Mock PR history loaded",
  isLoadingSource: false,
  lastUpdated: new Date(),
  events: [
    {
      title: "Risk model refreshed",
      detail: "6 open PRs scored against review load, CI state, size, and stale activity.",
      time: "just now",
    },
    {
      title: "Reviewer pressure detected",
      detail: "Morgan K. is above queue threshold for checkout and payments reviews.",
      time: "2 min ago",
    },
    {
      title: "CI pattern matched",
      detail: "Flaky auth smoke check has appeared on 2 PRs in platform-api.",
      time: "8 min ago",
    },
  ],
  reviewers: [
    { name: "Morgan K.", team: "Payments", queue: 8, capacity: 5, timezone: "ET", focus: "checkout, auth" },
    { name: "Isha R.", team: "Platform", queue: 3, capacity: 5, timezone: "IST", focus: "infra, data" },
    { name: "Leo M.", team: "Web", queue: 5, capacity: 6, timezone: "PT", focus: "frontend, design" },
    { name: "Anika S.", team: "Security", queue: 4, capacity: 4, timezone: "CET", focus: "security, tokens" },
  ],
  prs: [
    {
      id: 4821,
      title: "Secure checkout token refresh",
      repo: "payments-core",
      author: "Priya N.",
      reviewer: "Morgan K.",
      backupReviewer: "Anika S.",
      ageHours: 31,
      lines: 1280,
      files: 24,
      comments: 14,
      unresolved: 5,
      approvals: 0,
      requiredApprovals: 2,
      lastActivityHours: 5,
      ci: "failed",
      ciFailures: 2,
      label: "security",
    },
    {
      id: 4817,
      title: "Feature flag rollout for search facets",
      repo: "web-experience",
      author: "Noah T.",
      reviewer: "Leo M.",
      backupReviewer: "Isha R.",
      ageHours: 18,
      lines: 420,
      files: 11,
      comments: 6,
      unresolved: 1,
      approvals: 1,
      requiredApprovals: 2,
      lastActivityHours: 2,
      ci: "passed",
      ciFailures: 0,
      label: "frontend",
    },
    {
      id: 4815,
      title: "Streaming audit log compaction",
      repo: "platform-api",
      author: "Sam C.",
      reviewer: "Isha R.",
      backupReviewer: "Morgan K.",
      ageHours: 42,
      lines: 720,
      files: 16,
      comments: 22,
      unresolved: 8,
      approvals: 0,
      requiredApprovals: 2,
      lastActivityHours: 11,
      ci: "flaky",
      ciFailures: 1,
      label: "backend",
    },
    {
      id: 4809,
      title: "Catalog sync schema migration",
      repo: "data-services",
      author: "Mina P.",
      reviewer: "Isha R.",
      backupReviewer: "Leo M.",
      ageHours: 12,
      lines: 260,
      files: 7,
      comments: 3,
      unresolved: 0,
      approvals: 1,
      requiredApprovals: 1,
      lastActivityHours: 1,
      ci: "running",
      ciFailures: 0,
      label: "data",
    },
    {
      id: 4804,
      title: "Bulk invoice export flow",
      repo: "finance-ops",
      author: "Dev A.",
      reviewer: "Morgan K.",
      backupReviewer: "Leo M.",
      ageHours: 52,
      lines: 1980,
      files: 38,
      comments: 31,
      unresolved: 12,
      approvals: 0,
      requiredApprovals: 2,
      lastActivityHours: 18,
      ci: "failed",
      ciFailures: 3,
      label: "payments",
    },
    {
      id: 4798,
      title: "Notification retry copy update",
      repo: "web-experience",
      author: "Olivia H.",
      reviewer: "Leo M.",
      backupReviewer: "Isha R.",
      ageHours: 7,
      lines: 86,
      files: 3,
      comments: 2,
      unresolved: 0,
      approvals: 1,
      requiredApprovals: 1,
      lastActivityHours: 1,
      ci: "passed",
      ciFailures: 0,
      label: "copy",
    },
  ],
};

const selectors = {
  cycleRisk: document.querySelector("#cycleRisk"),
  cycleRiskHint: document.querySelector("#cycleRiskHint"),
  atRiskCount: document.querySelector("#atRiskCount"),
  riskDelta: document.querySelector("#riskDelta"),
  reviewerPressure: document.querySelector("#reviewerPressure"),
  reviewerPressureHint: document.querySelector("#reviewerPressureHint"),
  ciDrag: document.querySelector("#ciDrag"),
  ciDragHint: document.querySelector("#ciDragHint"),
  gaugeScore: document.querySelector("#gaugeScore"),
  freshness: document.querySelector("#freshness"),
  delayChart: document.querySelector("#delayChart"),
  actionList: document.querySelector("#actionList"),
  prTable: document.querySelector("#prTable"),
  detailBody: document.querySelector("#detailBody"),
  reviewerList: document.querySelector("#reviewerList"),
  eventLog: document.querySelector("#eventLog"),
  searchInput: document.querySelector("#searchInput"),
  sourceForm: document.querySelector("#sourceForm"),
  sourceUrl: document.querySelector("#sourceUrl"),
  sourceName: document.querySelector("#sourceName"),
  sourceStatus: document.querySelector("#sourceStatus"),
  loadSource: document.querySelector("#loadSource"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function reviewerByName(name) {
  return state.reviewers.find((reviewer) => reviewer.name === name);
}

function scorePullRequest(pr) {
  const reviewer = reviewerByName(pr.reviewer);
  const loadRatio = reviewer ? reviewer.queue / reviewer.capacity : 1;
  const ageRisk = clamp((pr.ageHours - 8) * 1.15, 0, 28);
  const sizeRisk = clamp((pr.lines - 350) / 30, 0, 28) + clamp((pr.files - 10) * 1.4, 0, 16);
  const reviewRisk =
    (pr.requiredApprovals - pr.approvals) * 11 +
    clamp(pr.unresolved * 2.3, 0, 24) +
    clamp((pr.lastActivityHours - 3) * 2.4, 0, 22);
  const loadRisk = clamp((loadRatio - 0.8) * 38, 0, 24);
  const ciRisk = pr.ci === "failed" ? 26 : pr.ci === "flaky" ? 17 : pr.ci === "running" ? 7 : 0;
  const score = clamp(Math.round(8 + ageRisk + sizeRisk + reviewRisk + loadRisk + ciRisk), 4, 98);
  const delayHours = clamp(Math.round(4 + score * 0.7 + pr.unresolved * 1.4 + pr.ciFailures * 5), 2, 96);
  const drivers = getDrivers(pr, reviewer, loadRatio);

  return {
    score,
    delayHours,
    level: score >= 70 ? "high" : score >= 42 ? "medium" : "low",
    drivers,
    primaryDriver: drivers[0]?.label || "Low risk",
  };
}

function getDrivers(pr, reviewer, loadRatio) {
  const drivers = [];

  if (pr.ci === "failed") {
    drivers.push({
      label: "CI failure",
      detail: `${pr.ciFailures} failing checks are blocking merge confidence.`,
      weight: 92,
      action: "Rerun stable CI lane",
    });
  }

  if (pr.ci === "flaky") {
    drivers.push({
      label: "Flaky CI",
      detail: "Recent runs show intermittent failure on the same job family.",
      weight: 70,
      action: "Quarantine flaky check",
    });
  }

  if (reviewer && loadRatio > 1) {
    drivers.push({
      label: "Reviewer overload",
      detail: `${reviewer.name} has ${reviewer.queue} queued reviews against capacity ${reviewer.capacity}.`,
      weight: clamp(Math.round(loadRatio * 45), 48, 96),
      action: `Route backup reviewer ${pr.backupReviewer}`,
    });
  }

  if (pr.lines > 900 || pr.files > 22) {
    drivers.push({
      label: "Oversized PR",
      detail: `${pr.lines.toLocaleString()} changed lines across ${pr.files} files raises review time.`,
      weight: clamp(Math.round(pr.lines / 20), 48, 95),
      action: "Split by ownership boundary",
    });
  }

  if (pr.lastActivityHours > 8) {
    drivers.push({
      label: "Stale thread",
      detail: `No meaningful activity for ${pr.lastActivityHours} hours.`,
      weight: clamp(pr.lastActivityHours * 5, 45, 90),
      action: "Send timed nudge",
    });
  }

  if (pr.unresolved > 4) {
    drivers.push({
      label: "Review churn",
      detail: `${pr.unresolved} unresolved conversations remain open.`,
      weight: clamp(pr.unresolved * 8, 40, 88),
      action: "Request focused author pass",
    });
  }

  if (!drivers.length) {
    drivers.push({
      label: "On track",
      detail: "Review, size, and CI signals are within the expected range.",
      weight: 22,
      action: "Keep monitoring",
    });
  }

  return drivers.sort((a, b) => b.weight - a.weight);
}

function getScoredPrs() {
  return state.prs
    .map((pr) => ({ ...pr, intelligence: scorePullRequest(pr) }))
    .sort((a, b) => b.intelligence.score - a.intelligence.score);
}

function filteredPrs() {
  const query = state.search.trim().toLowerCase();

  return getScoredPrs().filter((pr) => {
    const matchesQuery =
      !query ||
      `${pr.id} ${pr.title} ${pr.repo} ${pr.reviewer} ${pr.author} ${pr.label}`.toLowerCase().includes(query);
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "high" && pr.intelligence.level === "high") ||
      (state.filter === "reviewer" && pr.intelligence.drivers.some((driver) => driver.label === "Reviewer overload")) ||
      (state.filter === "ci" && ["failed", "flaky"].includes(pr.ci)) ||
      (state.filter === "size" && pr.intelligence.drivers.some((driver) => driver.label === "Oversized PR"));

    return matchesQuery && matchesFilter;
  });
}

function levelLabel(level) {
  if (level === "high") return "High";
  if (level === "medium") return "Med";
  return "Low";
}

function statusLabel(status) {
  if (status === "failed") return "Failed";
  if (status === "flaky") return "Flaky";
  if (status === "running") return "Running";
  return "Passed";
}

function renderSummary(scored) {
  if (!scored.length) {
    selectors.cycleRisk.textContent = "--";
    selectors.cycleRiskHint.textContent = "No source data";
    selectors.atRiskCount.textContent = "--";
    selectors.riskDelta.textContent = "Load a source";
    selectors.reviewerPressure.textContent = "--";
    selectors.reviewerPressureHint.textContent = "No reviewers";
    selectors.ciDrag.textContent = "--";
    selectors.ciDragHint.textContent = "No checks";
    selectors.gaugeScore.textContent = "--";
    return;
  }

  const averageRisk = Math.round(scored.reduce((sum, pr) => sum + pr.intelligence.score, 0) / scored.length);
  const highRisk = scored.filter((pr) => pr.intelligence.level === "high").length;
  const overloaded = state.reviewers.filter((reviewer) => reviewer.queue > reviewer.capacity);
  const ciBlocked = scored.filter((pr) => ["failed", "flaky"].includes(pr.ci)).length;
  const medianDelay = median(scored.map((pr) => pr.intelligence.delayHours));

  selectors.cycleRisk.textContent = `${medianDelay}h`;
  selectors.cycleRiskHint.textContent = averageRisk >= 70 ? "Delay risk rising" : averageRisk >= 42 ? "Watch queue health" : "Flow is stable";
  selectors.atRiskCount.textContent = `${highRisk}`;
  selectors.riskDelta.textContent = highRisk === 1 ? "1 PR needs action" : `${highRisk} PRs need action`;
  selectors.reviewerPressure.textContent = `${overloaded.length}`;
  selectors.reviewerPressureHint.textContent =
    overloaded.length === 0 ? "No overloaded reviewers" : overloaded.map((reviewer) => reviewer.name).join(", ");
  selectors.ciDrag.textContent = `${ciBlocked}`;
  selectors.ciDragHint.textContent = ciBlocked === 1 ? "1 blocked PR" : `${ciBlocked} blocked PRs`;
  selectors.gaugeScore.textContent = averageRisk;
  selectors.freshness.textContent = `Updated ${formatRelative(state.lastUpdated)}`;

  document.querySelector(".gauge-ring").style.background = `radial-gradient(circle at center, white 0 58%, transparent 59%), conic-gradient(${riskColor(
    averageRisk,
  )} 0deg ${averageRisk * 3.6}deg, #dfe7f0 ${averageRisk * 3.6}deg 360deg)`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function riskColor(score) {
  if (score >= 70) return "#c93535";
  if (score >= 42) return "#b96b00";
  return "#168751";
}

function formatRelative(date) {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

function renderChart(scored) {
  const topPrs = scored.slice(0, 6);
  if (!topPrs.length) {
    selectors.delayChart.innerHTML = `<div class="empty-state">No forecast data yet.</div>`;
    return;
  }

  const maxDelay = Math.max(...topPrs.map((pr) => pr.intelligence.delayHours), 1);

  selectors.delayChart.innerHTML = topPrs
    .map((pr) => {
      const width = Math.max(8, Math.round((pr.intelligence.delayHours / maxDelay) * 100));
      return `
        <div class="chart-row">
          <div class="chart-label">#${pr.id}</div>
          <div class="chart-track">
            <div class="chart-fill ${pr.intelligence.level}" style="width: ${width}%"></div>
          </div>
          <div class="chart-value">${pr.intelligence.delayHours}h</div>
        </div>
      `;
    })
    .join("");
}

function renderActions(scored) {
  const actions = scored.slice(0, 4).map((pr) => {
    const driver = pr.intelligence.drivers[0];
    const verb = actionVerb(driver.label);
    return { pr, driver, verb };
  });

  selectors.actionList.innerHTML = actions
    .map(
      ({ pr, driver, verb }) => `
        <article class="action-item">
          <strong>${escapeHtml(driver.action)}</strong>
          <div class="action-meta">
            <span>#${escapeHtml(pr.id)}</span>
            <span>${escapeHtml(driver.label)}</span>
            <span>${pr.intelligence.delayHours}h predicted delay</span>
          </div>
          <div class="action-controls">
            <button class="action-button" type="button" data-action="${verb}" data-pr="${pr.id}">Apply</button>
            <button class="ghost-button" type="button" data-select="${pr.id}">Inspect</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function actionVerb(label) {
  if (label === "CI failure" || label === "Flaky CI") return "ci";
  if (label === "Reviewer overload") return "backup";
  if (label === "Oversized PR") return "split";
  if (label === "Stale thread") return "nudge";
  if (label === "Review churn") return "author";
  return "monitor";
}

function renderTable() {
  const prs = filteredPrs();

  if (!prs.length) {
    selectors.prTable.innerHTML = `<tr><td colspan="6" class="empty-state">No PRs match the current queue view.</td></tr>`;
    return;
  }

  selectors.prTable.innerHTML = prs
    .map(
      (pr) => `
        <tr data-select="${pr.id}" class="${pr.id === state.selectedId ? "is-selected" : ""}">
          <td>
            <div class="pr-title">
              <strong>#${escapeHtml(pr.id)} ${escapeHtml(pr.title)}</strong>
              <small>${escapeHtml(pr.repo)} by ${escapeHtml(pr.author)} - ${pr.lines.toLocaleString()} lines, ${pr.files} files${pr.sourceKind ? ` - ${escapeHtml(pr.sourceKind)}` : ""}</small>
            </div>
          </td>
          <td><span class="risk-badge ${pr.intelligence.level}">${levelLabel(pr.intelligence.level)} ${pr.intelligence.score}</span></td>
          <td>${pr.intelligence.delayHours}h</td>
          <td><span class="tag">${escapeHtml(pr.intelligence.primaryDriver)}</span></td>
          <td>
            <div class="pr-title">
              <strong>${escapeHtml(pr.reviewer)}</strong>
              <small>backup ${escapeHtml(pr.backupReviewer)}</small>
            </div>
          </td>
          <td><span class="status-badge ${pr.ci}">${statusLabel(pr.ci)}</span></td>
        </tr>
      `,
    )
    .join("");
}

function renderDetails(scored) {
  const selected = scored.find((pr) => pr.id === state.selectedId) || scored[0];
  if (!selected) return;
  state.selectedId = selected.id;

  selectors.detailBody.innerHTML = `
    <div class="detail-body">
      <div class="detail-header">
        <strong>#${escapeHtml(selected.id)} ${escapeHtml(selected.title)}</strong>
        <span class="muted">${escapeHtml(selected.repo)} - ${selected.intelligence.delayHours}h delay forecast - ${selected.intelligence.score} risk score${selected.sourceKind ? ` - ${escapeHtml(selected.sourceKind)}` : ""}</span>
      </div>
      <div class="driver-list">
        ${selected.intelligence.drivers
          .slice(0, 4)
          .map(
            (driver) => `
              <div class="driver-row">
                <div class="driver-top">
                  <strong>${escapeHtml(driver.label)}</strong>
                  <span class="muted">${driver.weight}%</span>
                </div>
                <div class="mini-meter"><span class="${meterClass(driver.weight)}" style="width: ${driver.weight}%"></span></div>
                <span class="muted">${escapeHtml(driver.detail)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="detail-actions">
        <button class="action-button" type="button" data-action="nudge" data-pr="${selected.id}">Nudge reviewer</button>
        <button class="action-button" type="button" data-action="backup" data-pr="${selected.id}">Add backup</button>
        <button class="ghost-button" type="button" data-action="ci" data-pr="${selected.id}">Rerun CI</button>
        <button class="ghost-button" type="button" data-action="split" data-pr="${selected.id}">Split PR</button>
      </div>
    </div>
  `;
}

function meterClass(weight) {
  if (weight >= 72) return "hot";
  if (weight >= 45) return "warm";
  return "";
}

function renderReviewers() {
  selectors.reviewerList.innerHTML = state.reviewers
    .map((reviewer) => {
      const ratio = reviewer.queue / reviewer.capacity;
      const meterWidth = clamp(Math.round(ratio * 70), 12, 100);
      return `
        <div class="reviewer-row">
          <div class="reviewer-top">
            <strong>${escapeHtml(reviewer.name)}</strong>
            <span class="muted">${reviewer.queue}/${reviewer.capacity}</span>
          </div>
          <div class="mini-meter"><span class="${meterClass(meterWidth)}" style="width: ${meterWidth}%"></span></div>
          <span class="muted">${escapeHtml(reviewer.team)} - ${escapeHtml(reviewer.timezone)} - ${escapeHtml(reviewer.focus)}</span>
        </div>
      `;
    })
    .join("");
}

function renderEvents() {
  selectors.eventLog.innerHTML = state.events
    .slice(0, 6)
    .map(
      (event) => `
        <article class="event-item">
          <strong>${escapeHtml(event.title)}</strong>
          <span class="muted">${escapeHtml(event.detail)}</span>
          <small>${escapeHtml(event.time)}</small>
        </article>
      `,
    )
    .join("");
}

function renderSourceStatus() {
  selectors.sourceName.textContent = state.sourceName;
  selectors.sourceStatus.textContent = state.sourceStatus;
  selectors.loadSource.disabled = state.isLoadingSource;
  selectors.loadSource.textContent = state.isLoadingSource ? "Loading" : "Load source";
}

function render() {
  const scored = getScoredPrs();
  renderSourceStatus();
  renderSummary(scored);
  renderChart(scored);
  renderActions(scored);
  renderTable();
  renderDetails(scored);
  renderReviewers();
  renderEvents();
}

function pushEvent(title, detail) {
  state.events.unshift({ title, detail, time: "just now" });
  state.events = state.events.slice(0, 8);
  state.lastUpdated = new Date();
}

function findPr(id) {
  return state.prs.find((pr) => pr.id === Number(id));
}

function performAction(action, id) {
  const pr = findPr(id);
  if (!pr) return;

  if (action === "nudge") {
    pr.lastActivityHours = 0;
    pr.comments += 1;
    pushEvent("Reviewer nudge queued", `${pr.reviewer} receives a timed prompt for #${pr.id} in ${providerLabel()}.`);
  }

  if (action === "backup") {
    const current = reviewerByName(pr.reviewer);
    const backup = reviewerByName(pr.backupReviewer);
    if (current) current.queue = Math.max(0, current.queue - 1);
    if (backup) backup.queue += 1;
    pr.reviewer = pr.backupReviewer;
    pushEvent("Review rerouted", `Backup reviewer ${pr.backupReviewer} is assigned to #${pr.id}.`);
  }

  if (action === "ci") {
    pr.ci = "running";
    pr.ciFailures = Math.max(0, pr.ciFailures - 1);
    pushEvent("CI rerun started", `Stable lane queued for #${pr.id}; flaky jobs are marked for isolation.`);
    window.setTimeout(() => {
      pr.ci = pr.ciFailures > 0 ? "flaky" : "passed";
      pushEvent("CI result updated", `#${pr.id} checks finished with status ${statusLabel(pr.ci).toLowerCase()}.`);
      render();
    }, 1300);
  }

  if (action === "split") {
    pr.lines = Math.max(80, Math.round(pr.lines * 0.55));
    pr.files = Math.max(2, Math.round(pr.files * 0.6));
    pushEvent("Split recommendation accepted", `#${pr.id} is modeled as a smaller review slice.`);
  }

  if (action === "author") {
    pr.unresolved = Math.max(0, pr.unresolved - 3);
    pr.lastActivityHours = 0;
    pushEvent("Author pass requested", `${pr.author} receives a focused thread cleanup request for #${pr.id}.`);
  }

  if (action === "monitor") {
    pushEvent("Monitor rule kept", `#${pr.id} remains below active intervention threshold.`);
  }

  state.selectedId = pr.id;
  render();
}

function providerLabel() {
  return state.provider === "github" ? "GitHub" : "Azure DevOps";
}

function simulateEvent() {
  const scored = getScoredPrs();
  const target = scored[Math.floor(Math.random() * scored.length)];
  const eventType = Math.floor(Math.random() * 4);

  if (eventType === 0) {
    target.comments += 2;
    target.unresolved += 1;
    target.lastActivityHours = 0;
    pushEvent("Review activity ingested", `New comments landed on #${target.id}; risk score recalculated.`);
  }

  if (eventType === 1) {
    target.ci = target.ci === "passed" ? "flaky" : "failed";
    target.ciFailures += 1;
    pushEvent("CI signal ingested", `${providerLabel()} check data raised CI risk for #${target.id}.`);
  }

  if (eventType === 2) {
    target.ageHours += 6;
    target.lastActivityHours += 6;
    pushEvent("Queue aging detected", `#${target.id} crossed another review SLA window.`);
  }

  if (eventType === 3) {
    const reviewer = reviewerByName(target.reviewer);
    if (reviewer) reviewer.queue += 1;
    pushEvent("Reviewer load changed", `${target.reviewer} received another review request.`);
  }

  state.selectedId = target.id;
  render();
}

function setProvider(provider) {
  state.provider = provider;
  document.querySelectorAll("[data-provider]").forEach((button) => {
    const isActive = button.dataset.provider === state.provider;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function parseGitHubSource(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) throw new Error("Enter a GitHub organization, user, or repository URL.");

  const normalized = trimmed.includes("github.com") || trimmed.includes("://") ? trimmed : `https://github.com/${trimmed}`;
  const url = new URL(normalized);
  const hostname = url.hostname.replace(/^www\./, "");
  if (hostname !== "github.com") throw new Error("Use a github.com URL for this POC.");

  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  if (!owner) throw new Error("The GitHub URL needs an owner or organization.");
  return { owner, repo };
}

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${url.replace("https://api.github.com/", "")}.`);
  }

  return response.json();
}

async function fetchRepositories(source) {
  if (source.repo) {
    return [await fetchGitHubJson(`https://api.github.com/repos/${source.owner}/${source.repo}`)];
  }

  try {
    return await fetchGitHubJson(
      `https://api.github.com/orgs/${source.owner}/repos?per_page=20&sort=updated&direction=desc`,
    );
  } catch (orgError) {
    return fetchGitHubJson(`https://api.github.com/users/${source.owner}/repos?per_page=20&sort=updated&direction=desc`);
  }
}

async function fetchPullRequests(repos) {
  const batches = await Promise.all(
    repos.slice(0, 10).map(async (repo) => {
      try {
        const pulls = await fetchGitHubJson(
          `https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=5&sort=updated&direction=desc`,
        );
        return pulls.map((pull) => ({ repo, pull }));
      } catch (error) {
        return [];
      }
    }),
  );

  return batches.flat();
}

async function loadDetailedPulls(pullItems) {
  const details = await Promise.all(
    pullItems.slice(0, 8).map(async ({ repo, pull }, index) => {
      try {
        const detail = await fetchGitHubJson(pull.url);
        return mapPullToPr(detail, repo, index);
      } catch (error) {
        return mapPullToPr(pull, repo, index);
      }
    }),
  );

  return details;
}

function mapPullToPr(pull, repo, index) {
  const reviewer = pull.requested_reviewers?.[0]?.login || `reviewer-${(index % 4) + 1}`;
  const backupReviewer = pull.requested_reviewers?.[1]?.login || `reviewer-${((index + 1) % 4) + 1}`;
  const ageHours = hoursSince(pull.created_at);
  const lastActivityHours = hoursSince(pull.updated_at);
  const lines = clamp((pull.additions || 0) + (pull.deletions || 0) || repo.size * 5 || 120, 40, 2400);
  const files = clamp(pull.changed_files || Math.round(lines / 120) || 1, 1, 48);
  const comments = (pull.comments || 0) + (pull.review_comments || 0);
  const unresolved = pull.draft ? 2 : clamp(Math.round(comments * 0.4) + (lastActivityHours > 48 ? 2 : 0), 0, 12);
  const merged = Boolean(pull.merged_at);

  return {
    id: 9000 + index,
    title: pull.title || `Pull request ${pull.number}`,
    repo: repo.name,
    author: pull.user?.login || repo.owner?.login || "github-user",
    reviewer,
    backupReviewer,
    ageHours,
    lines,
    files,
    comments,
    unresolved,
    approvals: merged ? 1 : 0,
    requiredApprovals: files > 12 ? 2 : 1,
    lastActivityHours,
    ci: inferCiStatus({ merged, draft: pull.draft, ageHours, lastActivityHours, comments, index }),
    ciFailures: lastActivityHours > 48 && !merged ? 1 : 0,
    label: pull.labels?.[0]?.name || pull.base?.ref || repo.language || "pull-request",
    sourceKind: "GitHub PR",
  };
}

function mapRepoToPrProxy(repo, index) {
  const ageHours = hoursSince(repo.pushed_at || repo.updated_at || repo.created_at);
  const lines = clamp((repo.size || 12) * 8 + (repo.description?.length || 0) * 3, 80, 2200);
  const files = clamp(Math.round((repo.size || 8) / 3) + 4, 3, 42);
  const reviewer = `maintainer-${(index % 4) + 1}`;
  const backupReviewer = `maintainer-${((index + 1) % 4) + 1}`;
  const openItems = repo.open_issues_count || 0;
  const stale = ageHours > 30 * 24;

  return {
    id: 7000 + index,
    title: `Review latest ${repo.name.replace(/[-_]/g, " ")} changes`,
    repo: repo.name,
    author: repo.owner?.login || "github-owner",
    reviewer,
    backupReviewer,
    ageHours,
    lines,
    files,
    comments: openItems,
    unresolved: clamp(openItems + (stale ? 2 : 0), 0, 12),
    approvals: stale ? 0 : 1,
    requiredApprovals: files > 12 ? 2 : 1,
    lastActivityHours: ageHours,
    ci: repo.archived || openItems > 1 ? "failed" : stale ? "flaky" : index % 5 === 0 ? "running" : "passed",
    ciFailures: repo.archived || openItems > 1 ? 2 : stale ? 1 : 0,
    label: repo.language || "repository",
    sourceKind: "Repo proxy",
  };
}

function inferCiStatus({ merged, draft, ageHours, lastActivityHours, comments, index }) {
  if (merged) return "passed";
  if (draft) return "running";
  if (ageHours > 72 && lastActivityHours > 24) return "failed";
  if (comments > 8 || index % 5 === 0) return "flaky";
  return "passed";
}

function hoursSince(value) {
  if (!value) return 1;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 1;
  return Math.max(1, Math.round((Date.now() - timestamp) / 36e5));
}

function buildReviewersFromPrs(prs, sourceOwner) {
  const counts = new Map();
  prs.forEach((pr) => {
    counts.set(pr.reviewer, (counts.get(pr.reviewer) || 0) + 1);
  });

  return [...counts.entries()].slice(0, 6).map(([name, queue], index) => ({
    name,
    team: sourceOwner,
    queue: queue + (index === 0 && prs.length > 4 ? 2 : 0),
    capacity: 3 + (index % 3),
    timezone: "GitHub",
    focus: prs
      .filter((pr) => pr.reviewer === name)
      .map((pr) => pr.label)
      .slice(0, 2)
      .join(", "),
  }));
}

function dummyGitReposFallbackRepos() {
  const owner = { login: "DummyGitRepos" };
  const names = [
    ["Time-Travel-Chronicles", "A Git-based simulation of time travel challenges.", "2025-01-13T12:00:00Z", 2, 12],
    ["Adventure_World", "A sandbox for fun and experimentation with Git.", "2025-01-12T12:00:00Z", 0, 8],
    ["Cinematic_Universe", "Interconnected stories and characters for Git practice.", "2025-01-12T12:00:00Z", 0, 10],
    ["DC_Universe", "Heroes and villains while practicing Git commands.", "2025-01-12T12:00:00Z", 2, 9],
    ["Star_Wars_Chronicles", "A structured way to practice Git with Star Wars lore.", "2025-01-12T12:00:00Z", 3, 11],
    ["Middle_Earth_Legends", "Legends of Middle-earth for learning Git.", "2025-01-12T12:00:00Z", 0, 8],
    ["Marvel_Universe", "A Marvel-themed repository for Git experimentation.", "2025-01-12T12:00:00Z", 0, 9],
    ["Harry-Potter", "A wizarding playground to learn and practice Git commands.", "2025-01-12T12:00:00Z", 0, 10],
  ];

  return names.map(([name, description, pushedAt, openIssues, size]) => ({
    id: name.length * 101,
    name,
    full_name: `DummyGitRepos/${name}`,
    description,
    language: "Shell",
    open_issues_count: openIssues,
    size,
    pushed_at: pushedAt,
    updated_at: pushedAt,
    created_at: pushedAt,
    archived: false,
    owner,
  }));
}

function applyLoadedSource(source, repos, prs, status) {
  state.prs = prs;
  state.reviewers = buildReviewersFromPrs(prs, source.owner);
  state.selectedId = prs[0].id;
  state.search = "";
  selectors.searchInput.value = "";
  setFilter("all");
  setProvider("github");
  state.sourceName = `${source.owner}${source.repo ? `/${source.repo}` : ""}`;
  state.sourceStatus = status;
  selectors.sourceUrl.value = `https://github.com/${state.sourceName}`;
  state.events = [
    { title: "GitHub source loaded", detail: state.sourceStatus, time: "just now" },
    {
      title: prs.some((pr) => pr.sourceKind === "Repo proxy") ? "Repo proxy model active" : "Pull request model active",
      detail: `${prs.length} records scored from ${repos.length} public repositories.`,
      time: "just now",
    },
    {
      title: "Risk model refreshed",
      detail: `${prs.length} records scored against review load, CI state, size, and stale activity.`,
      time: "just now",
    },
  ];
  state.lastUpdated = new Date();
  render();
}

async function loadGitHubSource(rawValue) {
  state.isLoadingSource = true;
  state.sourceStatus = "Loading GitHub source";
  renderSourceStatus();

  let source;
  try {
    source = parseGitHubSource(rawValue);
    const repos = await fetchRepositories(source);
    if (!repos.length) throw new Error("No public repositories were returned.");

    const pullItems = await fetchPullRequests(repos);
    const prs = pullItems.length
      ? await loadDetailedPulls(pullItems)
      : repos.slice(0, 8).map((repo, index) => mapRepoToPrProxy(repo, index));

    if (!prs.length) throw new Error("No pull request or repository telemetry could be modeled.");

    const status = pullItems.length
      ? `${pullItems.length} public pull requests modeled from ${repos.length} repos`
      : `No PRs found; using ${prs.length} public repos as proxy telemetry`;
    applyLoadedSource(source, repos, prs, status);
  } catch (error) {
    if (source?.owner?.toLowerCase() === "dummygitrepos" && !source.repo) {
      const repos = dummyGitReposFallbackRepos();
      const prs = repos.map((repo, index) => mapRepoToPrProxy(repo, index));
      applyLoadedSource(source, repos, prs, "GitHub API blocked; using public DummyGitRepos repo fallback");
      state.isLoadingSource = false;
      renderSourceStatus();
      return;
    }

    state.sourceStatus = error.message;
    pushEvent("Source load failed", error.message);
    render();
  } finally {
    state.isLoadingSource = false;
    renderSourceStatus();
  }
}

document.addEventListener("click", (event) => {
  const providerButton = event.target.closest("[data-provider]");
  if (providerButton) {
    setProvider(providerButton.dataset.provider);
    pushEvent("Source switched", `${providerLabel()} sample telemetry is now active.`);
    render();
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    setFilter(filterButton.dataset.filter);
    renderTable();
    return;
  }

  const selectTarget = event.target.closest("[data-select]");
  if (selectTarget) {
    state.selectedId = Number(selectTarget.dataset.select);
    render();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    performAction(actionButton.dataset.action, actionButton.dataset.pr);
  }
});

selectors.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTable();
});

selectors.sourceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadGitHubSource(selectors.sourceUrl.value);
});

document.querySelector("#simulateEvent").addEventListener("click", simulateEvent);

window.setInterval(() => {
  selectors.freshness.textContent = `Updated ${formatRelative(state.lastUpdated)}`;
}, 5000);

render();
