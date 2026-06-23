const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_STORAGE_KEY = "loop-library-theme";

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
  }

  if (themeColor) {
    themeColor.setAttribute("content", isDark ? "#101010" : "#faf8f7");
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies for this page view.
    }
  }
}

applyTheme(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

themeMedia.addEventListener("change", (event) => {
  if (!readStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

const searchInput = document.querySelector("#loop-search");
const loopRows = [...document.querySelectorAll(".loop-row")];
const categoryFilters = [
  ...document.querySelectorAll("[data-category-filter]"),
];
const sortSelect = document.querySelector("#loop-sort");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const pagination = document.querySelector("#library-pagination");
const paginationPrevious = document.querySelector("#pagination-previous");
const paginationNext = document.querySelector("#pagination-next");
const paginationStatus = document.querySelector("#pagination-status");
const toast = document.querySelector("#toast");
const PAGE_SIZE = 25;

const loopTableBody = document.querySelector(".loop-table tbody");
const loopRowPositions = new Map(
  loopRows.map((row, index) => [row, index]),
);
const SORT_OPTIONS = new Set([
  "featured",
  "newest",
  "oldest",
  "alphabetical",
]);

let activeSort = "featured";

if (sortSelect) {
  sortSelect.addEventListener("pointerdown", () => {
    sortSelect.classList.add("is-pointer-focused");
  });
  sortSelect.addEventListener("keydown", () => {
    sortSelect.classList.remove("is-pointer-focused");
  });
  sortSelect.addEventListener("blur", () => {
    sortSelect.classList.remove("is-pointer-focused");
  });
}

function rowTitle(row) {
  return normalize(row.querySelector(".loop-title-link")?.textContent ?? "");
}

function compareNewest(a, b) {
  const publishedDifference = (b.dataset.published ?? "").localeCompare(
    a.dataset.published ?? "",
  );

  if (publishedDifference !== 0) {
    return publishedDifference;
  }

  return loopRowPositions.get(b) - loopRowPositions.get(a);
}

function compareOldest(a, b) {
  const publishedDifference = (a.dataset.published ?? "").localeCompare(
    b.dataset.published ?? "",
  );

  if (publishedDifference !== 0) {
    return publishedDifference;
  }

  return loopRowPositions.get(a) - loopRowPositions.get(b);
}

function compareFeatured(a, b) {
  const featuredDifference =
    Number(b.dataset.featured === "true") -
    Number(a.dataset.featured === "true");

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  if (a.dataset.featured === "true") {
    return loopRowPositions.get(a) - loopRowPositions.get(b);
  }

  return compareNewest(a, b);
}

function applySort(sort) {
  activeSort = SORT_OPTIONS.has(sort) ? sort : "featured";

  if (sortSelect) {
    sortSelect.value = activeSort;
  }

  loopRows.sort((a, b) => {
    if (activeSort === "alphabetical") {
      return rowTitle(a).localeCompare(rowTitle(b), undefined, {
        sensitivity: "base",
      });
    }

    if (activeSort === "newest") {
      return compareNewest(a, b);
    }

    return activeSort === "oldest" ? compareOldest(a, b) : compareFeatured(a, b);
  });

  if (loopTableBody) {
    loopRows.forEach((row) => loopTableBody.append(row));
  }
}

applySort(activeSort);

// Snapshot each row's searchable text before the prompt toggle is injected
// below. Read the loop content rather than the whole row so search does not
// match interface controls such as "Copy loop" or "Show more".
const rowSearchText = new Map(
  loopRows.map((row) => {
    const content = row.querySelector(".cell-loop") ?? row;
    return [row, normalize(`${row.dataset.search ?? ""} ${content.textContent}`)];
  }),
);

const promptPreviews = loopRows
  .map((row, index) => {
    const prompt = row.querySelector("[data-prompt]");

    if (!prompt) {
      return null;
    }

    const loopSlug =
      row
        .querySelector(".loop-title-link")
        ?.getAttribute("href")
        ?.split("/")
        .filter(Boolean)
        .at(-1) || `item-${index + 1}`;
    const button = document.createElement("button");
    const preview = { button, prompt, row };

    prompt.id = `loop-prompt-${loopSlug}`;
    prompt.classList.add("is-collapsible");
    button.className = "loop-prompt-toggle";
    button.type = "button";
    button.hidden = true;
    button.textContent = "Show more";
    button.setAttribute("aria-controls", prompt.id);
    button.setAttribute("aria-expanded", "false");
    prompt.insertAdjacentElement("afterend", button);

    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      button.setAttribute("aria-expanded", String(nextExpanded));
      button.textContent = nextExpanded ? "Show less" : "Show more";
      prompt.classList.toggle("is-expanded", nextExpanded);
    });

    return preview;
  })
  .filter(Boolean);

function syncPromptToggle({ button, prompt, row }) {
  if (row.hidden) {
    return;
  }

  if (button.getAttribute("aria-expanded") === "true") {
    button.hidden = false;
    return;
  }

  button.hidden = prompt.scrollHeight <= prompt.clientHeight + 1;
}

function syncVisiblePromptToggles() {
  promptPreviews.forEach(syncPromptToggle);
}

let activeCategory = "all";
let currentPage = 1;
let toastTimer;

function normalize(value) {
  return value.toLowerCase().trim();
}

function updateLibrary() {
  if (!searchInput || !resultsCount || !emptyState) {
    return;
  }

  const query = normalize(searchInput.value);
  const matchingRows = loopRows.filter((row) => {
    const searchableText = rowSearchText.get(row) ?? "";
    const matchesSearch =
      query.length === 0 || searchableText.includes(query);
    const matchesCategory =
      activeCategory === "all" || row.dataset.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalMatches = matchingRows.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalMatches);
  const pageRows = new Set(matchingRows.slice(pageStart, pageEnd));

  loopRows.forEach((row) => {
    row.hidden = !pageRows.has(row);
  });

  if (totalMatches === 0) {
    resultsCount.textContent = "Showing 0 loops";
  } else if (totalMatches === 1) {
    resultsCount.textContent = "Showing 1 loop";
  } else {
    resultsCount.textContent = `Showing ${pageStart + 1}–${pageEnd} of ${totalMatches} loops`;
  }

  emptyState.hidden = totalMatches !== 0;

  if (
    pagination &&
    paginationPrevious &&
    paginationNext &&
    paginationStatus
  ) {
    pagination.hidden = totalPages <= 1;
    paginationPrevious.disabled = currentPage === 1;
    paginationNext.disabled = currentPage === totalPages;
    paginationStatus.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  window.requestAnimationFrame(syncVisiblePromptToggles);
}

// Keep the library's state shareable without discarding tracking or other
// query parameters owned by the surrounding site.
function syncUrlState(method = "replace") {
  if (typeof window.history?.replaceState !== "function") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const query = searchInput?.value.trim() ?? "";

  if (query) {
    params.set("q", query);
  } else {
    params.delete("q");
  }

  if (activeCategory && activeCategory !== "all") {
    params.set("category", activeCategory);
  } else {
    params.delete("category");
  }

  if (activeSort !== "featured") {
    params.set("sort", activeSort);
  } else {
    params.delete("sort");
  }

  if (currentPage > 1) {
    params.set("page", String(currentPage));
  } else {
    params.delete("page");
  }

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${
    window.location.hash
  }`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  if (method === "push" && typeof window.history.pushState === "function") {
    window.history.pushState(null, "", nextUrl);
  } else {
    window.history.replaceState(null, "", nextUrl);
  }
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);

  if (searchInput) {
    searchInput.value = params.get("q") ?? "";
  }

  applyCategory(params.get("category") ?? "all");
  applySort(params.get("sort") ?? "featured");

  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
}

function focusFirstVisibleLoop() {
  const firstVisibleTitle = loopRows
    .find((row) => !row.hidden)
    ?.querySelector(".loop-title-link");

  if (!firstVisibleTitle) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      firstVisibleTitle.focus({ preventScroll: true });
      firstVisibleTitle.scrollIntoView({ behavior: "instant", block: "start" });
    });
  });
}

if (searchInput) {
  const resetSearchPage = () => {
    currentPage = 1;
    updateLibrary();
    syncUrlState("replace");
  };

  searchInput.addEventListener("input", resetSearchPage);
  searchInput.addEventListener("search", resetSearchPage);
}

function applyCategory(category) {
  const known = categoryFilters.some(
    (filter) => filter.dataset.categoryFilter === category,
  );
  activeCategory = known ? category : "all";

  categoryFilters.forEach((candidate) => {
    const isActive = candidate.dataset.categoryFilter === activeCategory;
    candidate.classList.toggle("is-active", isActive);
    candidate.setAttribute("aria-pressed", String(isActive));
  });
}

categoryFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    applyCategory(filter.dataset.categoryFilter);
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
  });
});

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    applySort(sortSelect.value);
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
  });
}

const clearFiltersButton = document.querySelector("#clear-filters");

if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }

    applyCategory("all");
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
    searchInput?.focus();
  });
}

if (paginationPrevious) {
  paginationPrevious.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      updateLibrary();
      syncUrlState("push");
      focusFirstVisibleLoop();
    }
  });
}

if (paginationNext) {
  paginationNext.addEventListener("click", () => {
    currentPage += 1;
    updateLibrary();
    syncUrlState("push");
    focusFirstVisibleLoop();
  });
}

readUrlState();
updateLibrary();
syncUrlState("replace");

window.addEventListener("popstate", () => {
  readUrlState();
  updateLibrary();
});

let promptResizeFrame;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(promptResizeFrame);
  promptResizeFrame = window.requestAnimationFrame(syncVisiblePromptToggles);
});

function showToast(message) {
  if (!toast) {
    return;
  }

  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the selection-based copy path.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("Copy is unavailable.");
  }
}

function showCopyFallback(button, text) {
  const shareActions = button.closest(".share-actions");

  if (!shareActions) {
    showToast("Copy failed. Copying is unavailable in this browser.");
    return;
  }

  let fallback = shareActions.querySelector(".copy-fallback");

  if (!fallback) {
    fallback = document.createElement("label");
    fallback.className = "copy-fallback";

    const label = document.createElement("span");
    label.textContent = "Copy this post manually";

    const textArea = document.createElement("textarea");
    textArea.setAttribute("readonly", "");
    textArea.rows = 4;

    fallback.append(label, textArea);
    shareActions.append(fallback);
  }

  const textArea = fallback.querySelector("textarea");
  textArea.value = text;
  textArea.focus();
  textArea.select();
  showToast("Copy failed. The post is selected below.");
}

document.querySelectorAll(".copy-button").forEach((button) => {
  const label = button.querySelector("span");
  const defaultLabel = label?.textContent;
  let copyLabelResetTimer;

  button.addEventListener("click", async () => {
    const copyRoot = button.closest("[data-copy-root]");
    const prompt = copyRoot?.querySelector("[data-prompt]")?.textContent.trim();

    if (!prompt || !label || !defaultLabel) {
      return;
    }

    try {
      await copyText(prompt.replace(/\s+/g, " "));
      label.textContent = "Copied";
      showToast("Loop copied to clipboard.");
      window.clearTimeout(copyLabelResetTimer);
      copyLabelResetTimer = window.setTimeout(() => {
        label.textContent = defaultLabel;
      }, 1800);
    } catch {
      showToast("Copy failed. Select the prompt text instead.");
    }
  });
});

document.querySelectorAll("[data-copy-social-post]").forEach((button) => {
  const label = button.querySelector("span");
  const postText = button.dataset.postText;
  const postUrl = button.dataset.postUrl;
  const defaultLabel = label?.textContent;
  let copyLabelResetTimer;

  button.addEventListener("click", async () => {
    if (!label || !postText || !postUrl || !defaultLabel) {
      return;
    }

    const socialPost = `${postText}\n\n${postUrl}`;

    try {
      await copyText(socialPost);
      label.textContent = "Copied!";
      button.classList.add("is-copied");
      showToast("Social post copied to clipboard.");
      window.clearTimeout(copyLabelResetTimer);
      copyLabelResetTimer = window.setTimeout(() => {
        label.textContent = defaultLabel;
        button.classList.remove("is-copied");
      }, 1800);
    } catch {
      showCopyFallback(button, socialPost);
    }
  });
});

const skillCopyButton = document.querySelector("[data-copy-skill-command]");
const skillInstallCommand = document.querySelector(
  "[data-skill-install-command]",
);

if (skillCopyButton && skillInstallCommand) {
  skillCopyButton.addEventListener("click", async () => {
    const label = skillCopyButton.querySelector("span");
    const command = skillInstallCommand.textContent.replace(/\s+/g, " ").trim();

    if (!label || !command) {
      return;
    }

    try {
      await copyText(command);
      label.textContent = "Copied";
      showToast("Install command copied to clipboard.");
      window.setTimeout(() => {
        label.textContent = "Copy command";
      }, 1800);
    } catch {
      showToast("Copy failed. Select the install command instead.");
    }
  });
}

const form = document.querySelector("#loop-form");
const formStatus = document.querySelector("#form-status");
const submitButton = form?.querySelector(".submit-button");
const submitButtonLabel = submitButton?.querySelector("span");
const weeklyForm = document.querySelector("#weekly-form");
const weeklyStatus = document.querySelector("#weekly-status");
const weeklyButton = weeklyForm?.querySelector(".newsletter-button");
const weeklyButtonLabel = weeklyButton?.querySelector("span");
const formApiMeta = document.querySelector(
  'meta[name="loop-library-form-api"]',
);
const configuredFormApiOrigin = formApiMeta?.getAttribute("content") || "";
const isLocalPreview = ["localhost", "127.0.0.1"].includes(
  window.location.hostname,
);
const FORM_API_ORIGIN = isLocalPreview
  ? "http://localhost:8787"
  : configuredFormApiOrigin;

let formStartedAt = performance.now();
let idempotencyKey = makeIdempotencyKey();
let weeklyFormStartedAt = performance.now();
let weeklyIdempotencyKey = makeIdempotencyKey();
let formProtectionReady = false;
let turnstileLoadPromise;

const turnstileWidgets = {
  suggestions: {
    action: "",
    container: document.querySelector("#loop-turnstile"),
    id: null,
    token: "",
  },
  weeklySignups: {
    action: "",
    container: document.querySelector("#weekly-turnstile"),
    id: null,
    token: "",
  },
};

function makeIdempotencyKey() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) =>
    byte.toString(16).padStart(2, "0"),
  );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}

function setFormStatus(message, kind = "") {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.toggle("is-success", kind === "success");
  formStatus.classList.toggle("is-error", kind === "error");
}

function setWeeklyStatus(message, kind = "") {
  if (!weeklyStatus) {
    return;
  }

  weeklyStatus.textContent = message;
  weeklyStatus.classList.toggle("is-success", kind === "success");
  weeklyStatus.classList.toggle("is-error", kind === "error");
}

function optionalValue(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return value || undefined;
}

function setProtectedButtonsDisabled(disabled) {
  if (submitButton) {
    submitButton.disabled = disabled;
  }

  if (weeklyButton) {
    weeklyButton.disabled = disabled;
  }
}

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }

  turnstileLoadPromise = new Promise((resolve, reject) => {
    const callbackName = "loopLibraryTurnstileReady";
    const script = document.createElement("script");

    window[callbackName] = () => {
      delete window[callbackName];

      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error("Spam protection did not initialize."));
      }
    };

    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js" +
      `?render=explicit&onload=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error("Spam protection could not be loaded."));
    };
    document.head.append(script);
  });

  return turnstileLoadPromise;
}

function renderTurnstile(turnstile, widget, siteKey) {
  if (!widget.container || !widget.action) {
    throw new Error("Spam protection is not configured.");
  }

  widget.id = turnstile.render(widget.container, {
    sitekey: siteKey,
    action: widget.action,
    appearance: "interaction-only",
    execution: "render",
    size: "flexible",
    theme:
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    callback(token) {
      widget.token = token;
    },
    "expired-callback"() {
      widget.token = "";
    },
    "error-callback"() {
      widget.token = "";
    },
  });
}

function resetTurnstile(widget) {
  widget.token = "";

  if (window.turnstile && widget.id !== null) {
    window.turnstile.reset(widget.id);
  }
}

async function initializeFormProtection() {
  if (
    !FORM_API_ORIGIN ||
    !form ||
    !weeklyForm ||
    !submitButton ||
    !weeklyButton
  ) {
    return;
  }

  setProtectedButtonsDisabled(true);

  try {
    const [configResponse, turnstile] = await Promise.all([
      fetch(`${FORM_API_ORIGIN}/config`, {
        headers: { Accept: "application/json" },
      }),
      loadTurnstile(),
    ]);
    const config = await configResponse.json();

    if (
      !configResponse.ok ||
      !config.turnstileSiteKey ||
      !config.actions?.suggestions ||
      !config.actions?.weeklySignups
    ) {
      throw new Error(
        config.error || "Spam protection is temporarily unavailable.",
      );
    }

    turnstileWidgets.suggestions.action = config.actions.suggestions;
    turnstileWidgets.weeklySignups.action = config.actions.weeklySignups;
    renderTurnstile(
      turnstile,
      turnstileWidgets.suggestions,
      config.turnstileSiteKey,
    );
    renderTurnstile(
      turnstile,
      turnstileWidgets.weeklySignups,
      config.turnstileSiteKey,
    );
    formProtectionReady = true;
    setProtectedButtonsDisabled(false);
  } catch {
    setFormStatus(
      "Submissions are temporarily unavailable. Refresh and try again.",
      "error",
    );
    setWeeklyStatus(
      "Signups are temporarily unavailable. Refresh and try again.",
      "error",
    );
  }
}

function formatRetryHint(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }

  if (seconds < 90) {
    const rounded = Math.max(1, Math.ceil(seconds));
    return ` Try again in about ${rounded} second${rounded === 1 ? "" : "s"}.`;
  }

  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return ` Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

async function postProtectedForm(path, body, fallbackMessage) {
  const response = await fetch(`${FORM_API_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let responseBody = {};
  try {
    responseBody = await response.json();
  } catch {
    responseBody = {};
  }

  if (!response.ok) {
    let message = responseBody.error || fallbackMessage;

    if (response.status === 429) {
      message += formatRetryHint(Number(response.headers.get("Retry-After")));
    }

    throw new Error(message);
  }
}

if (form && submitButton && submitButtonLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      setFormStatus(
        "Check the required fields and any optional values you entered.",
        "error",
      );
      return;
    }

    const formData = new FormData(form);

    if (performance.now() - formStartedAt < 1200) {
      setFormStatus(
        "Take a moment to review the loop, then submit it again.",
        "error",
      );
      return;
    }

    if (!formProtectionReady || !turnstileWidgets.suggestions.token) {
      setFormStatus(
        "Complete the verification check before submitting.",
        "error",
      );
      return;
    }

    const payload = {
      loop_title: String(formData.get("loop_title")).trim(),
      instructions: String(formData.get("instructions")).trim(),
    };

    const name = optionalValue(formData, "name");
    const xHandle = optionalValue(formData, "x_handle");
    const sourceUrl = optionalValue(formData, "source_url");

    if (name) {
      payload.name = name;
    }

    if (xHandle) {
      payload.x_handle = xHandle;
    }

    if (sourceUrl) {
      payload.source_url = sourceUrl;
    }

    submitButton.disabled = true;
    submitButtonLabel.textContent = "Sending";

    try {
      await postProtectedForm(
        "/suggestions",
        {
          payload,
          permission: formData.get("permission") === "on",
          honeypot: String(formData.get("company") || "").trim(),
          idempotency_key: idempotencyKey,
          turnstile_token: turnstileWidgets.suggestions.token,
        },
        "The suggestion could not be submitted.",
      );

      form.reset();
      setFormStatus(
        "Received. The loop is now in the private review queue.",
        "success",
      );
      idempotencyKey = makeIdempotencyKey();
      formStartedAt = performance.now();
      resetTurnstile(turnstileWidgets.suggestions);
    } catch (error) {
      resetTurnstile(turnstileWidgets.suggestions);
      setFormStatus(
        error.message || "Something went wrong. Try again in a moment.",
        "error",
      );
    } finally {
      submitButton.disabled = false;
      submitButtonLabel.textContent = "Submit loop";
    }
  });
}

if (weeklyForm && weeklyButton && weeklyButtonLabel) {
  weeklyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setWeeklyStatus("");

    if (!weeklyForm.checkValidity()) {
      weeklyForm.reportValidity();
      setWeeklyStatus("Enter a valid email address.", "error");
      return;
    }

    const formData = new FormData(weeklyForm);

    if (performance.now() - weeklyFormStartedAt < 800) {
      setWeeklyStatus("Take a moment, then submit again.", "error");
      return;
    }

    if (!formProtectionReady || !turnstileWidgets.weeklySignups.token) {
      setWeeklyStatus(
        "Complete the verification check before signing up.",
        "error",
      );
      return;
    }

    weeklyButton.disabled = true;
    weeklyButtonLabel.textContent = "Adding";

    try {
      await postProtectedForm(
        "/weekly-signups",
        {
          payload: { email: String(formData.get("email")).trim() },
          honeypot: String(
            formData.get("newsletter_company") || "",
          ).trim(),
          idempotency_key: weeklyIdempotencyKey,
          turnstile_token: turnstileWidgets.weeklySignups.token,
        },
        "The signup could not be submitted.",
      );
      weeklyForm.reset();
      setWeeklyStatus(
        "You’re on the list. Watch your inbox for the best loops.",
        "success",
      );
      weeklyIdempotencyKey = makeIdempotencyKey();
      weeklyFormStartedAt = performance.now();
      resetTurnstile(turnstileWidgets.weeklySignups);
    } catch (error) {
      resetTurnstile(turnstileWidgets.weeklySignups);
      setWeeklyStatus(
        error.message || "Something went wrong. Try again in a moment.",
        "error",
      );
    } finally {
      weeklyButton.disabled = false;
      weeklyButtonLabel.textContent = "Notify me weekly";
    }
  });
}

initializeFormProtection();
