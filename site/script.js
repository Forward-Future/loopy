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
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");

let activeCategory = "all";
let toastTimer;

function normalize(value) {
  return value.toLowerCase().trim();
}

function updateLibrary() {
  if (!searchInput || !resultsCount || !emptyState) {
    return;
  }

  const query = normalize(searchInput.value);
  let visibleCount = 0;

  loopRows.forEach((row) => {
    const searchableText = `${row.dataset.search} ${row.textContent}`;
    const matchesSearch =
      query.length === 0 || normalize(searchableText).includes(query);
    const matchesCategory =
      activeCategory === "all" || row.dataset.category === activeCategory;
    const isVisible = matchesSearch && matchesCategory;

    row.hidden = !isVisible;
    if (isVisible) {
      visibleCount += 1;
    }
  });

  resultsCount.textContent = `Showing ${visibleCount} ${
    visibleCount === 1 ? "loop" : "loops"
  }`;
  emptyState.hidden = visibleCount !== 0;
}

if (searchInput) {
  searchInput.addEventListener("input", updateLibrary);
  searchInput.addEventListener("search", updateLibrary);
}

categoryFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    activeCategory = filter.dataset.categoryFilter;

    categoryFilters.forEach((candidate) => {
      const isActive = candidate === filter;
      candidate.classList.toggle("is-active", isActive);
      candidate.setAttribute("aria-pressed", String(isActive));
    });

    updateLibrary();
  });
});

updateLibrary();

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

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const copyRoot = button.closest("[data-copy-root]");
    const prompt = copyRoot?.querySelector("[data-prompt]")?.textContent.trim();
    const label = button.querySelector("span");

    if (!prompt || !label) {
      return;
    }

    try {
      await copyText(prompt.replace(/\s+/g, " "));
      label.textContent = "Copied";
      showToast("Loop copied to clipboard.");
      window.setTimeout(() => {
        label.textContent = "Copy";
      }, 1800);
    } catch {
      showToast("Copy failed. Select the prompt text instead.");
    }
  });
});

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
    throw new Error(
      responseBody.error || fallbackMessage,
    );
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
