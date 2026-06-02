(function () {
  "use strict";

  const data = window.OsherAssistantData;
  if (!data || !data.nodes || document.querySelector(".osher-assistant")) return;

  const script = document.currentScript || Array.from(document.scripts).find((item) => item.src.includes("osher-assistant.js"));
  const siteBase = script && script.src ? script.src.replace(/assets\/js\/osher-assistant\.js(?:\?.*)?$/, "") : "/";
  const storageKey = "osherAssistantOpen";

  const state = {
    current: data.home || "home",
    stack: [],
    openedOnce: false
  };

  const assistant = document.createElement("section");
  assistant.className = "osher-assistant";
  assistant.setAttribute("aria-label", "אושר - עוזר האתר של GEN1");
  assistant.innerHTML = `
    <button class="osher-toggle" type="button" aria-label="פתח את אושר, עוזר האתר" aria-expanded="false">
      <img src="${resolveUrl("assets/img/osher-avatar.png")}" alt="" aria-hidden="true">
    </button>
    <div class="osher-window" role="dialog" aria-modal="false" aria-labelledby="osher-title">
      <header class="osher-header">
        <img class="osher-avatar" src="${resolveUrl("assets/img/osher-avatar.png")}" alt="" aria-hidden="true">
        <div class="osher-title">
          <strong id="osher-title">אושר</strong>
          <span>המדריך הידידותי של GEN1</span>
        </div>
        <button class="osher-close" type="button" aria-label="סגור את אושר">×</button>
      </header>
      <div class="osher-body" aria-live="polite"></div>
      <div class="osher-utility" aria-label="פעולות ניווט בשיחה"></div>
      <form class="osher-input">
        <label class="osher-sr-only" for="osher-keyword">כתוב מילה לאושר</label>
        <input id="osher-keyword" type="text" autocomplete="off" placeholder="כתוב מילה כמו: נשימה, דיור, AI, עדות...">
        <button type="submit">שלח</button>
      </form>
    </div>
  `;

  document.body.appendChild(assistant);

  const toggle = assistant.querySelector(".osher-toggle");
  const closeButton = assistant.querySelector(".osher-close");
  const body = assistant.querySelector(".osher-body");
  const utility = assistant.querySelector(".osher-utility");
  const form = assistant.querySelector(".osher-input");
  const input = assistant.querySelector(".osher-input input");

  toggle.addEventListener("click", () => setOpen(!assistant.classList.contains("is-open")));
  closeButton.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", onSubmitKeyword);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && assistant.classList.contains("is-open")) setOpen(false);
  });

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-osher-open]");
    if (!opener) return;
    event.preventDefault();
    setOpen(true);
  });

  if (localStorage.getItem(storageKey) === "true") {
    setOpen(true);
  }

  function setOpen(open) {
    assistant.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    localStorage.setItem(storageKey, String(open));
    if (open && !state.openedOnce) {
      state.openedOnce = true;
      renderNode(data.home || "home", { silentUser: true, replace: true });
      setTimeout(() => input.focus({ preventScroll: true }), 80);
    }
  }

  function renderNode(id, options = {}) {
    const node = data.nodes[id] || data.nodes[data.home];
    if (!node) return;

    if (!options.replace && state.current && state.current !== id) {
      state.stack.push(state.current);
    }

    state.current = id;

    if (options.replace) {
      body.innerHTML = "";
      state.stack = [];
    }

    if (options.userLabel) addMessage(options.userLabel, "user");
    addMessage(formatBotMessage(node), "bot", true);
    renderOptions(node.options || []);
    renderUtility();
    scrollToBottom();
  }

  function addMessage(text, type, allowHtml) {
    const item = document.createElement("div");
    item.className = `osher-message osher-message-${type}`;
    const bubble = document.createElement("span");
    if (allowHtml) bubble.innerHTML = text;
    else bubble.textContent = text;
    item.appendChild(bubble);
    body.appendChild(item);
  }

  function formatBotMessage(node) {
    const title = node.title ? `<strong class="osher-node-title">${escapeHtml(node.title)}</strong>` : "";
    return `${title}${escapeHtml(node.message || "").replace(/\n/g, "<br>")}`;
  }

  function renderOptions(options) {
    const old = body.querySelector(".osher-options:last-child");
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.className = "osher-options";

    options.slice(0, 4).forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `osher-option${option.url ? " is-link" : ""}`;
      button.textContent = option.label;
      button.addEventListener("click", () => chooseOption(option));
      wrap.appendChild(button);
    });

    body.appendChild(wrap);
  }

  function renderUtility() {
    utility.innerHTML = "";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "osher-option";
    back.textContent = "חזור שלב אחד אחורה";
    back.disabled = state.stack.length === 0;
    back.addEventListener("click", goBack);
    utility.appendChild(back);

    const home = document.createElement("button");
    home.type = "button";
    home.className = "osher-option";
    home.textContent = "חזרה להתחלה";
    home.addEventListener("click", () => {
      addMessage("חזרה להתחלה", "user");
      renderNode(data.home || "home", { replace: true });
    });
    utility.appendChild(home);

    const links = document.createElement("button");
    links.type = "button";
    links.className = "osher-option";
    links.textContent = "קישורים באתר";
    links.addEventListener("click", () => {
      addMessage("קישורים באתר", "user");
      renderSiteLinks();
    });
    utility.appendChild(links);
  }

  function chooseOption(option) {
    if (option.url) {
      addMessage(option.label, "user");
      const message = `בשמחה. זה הקישור המתאים באתר: ${option.label}`;
      addMessage(message, "bot");
      window.location.href = resolveUrl(option.url);
      return;
    }

    renderNode(option.next || data.home, { userLabel: option.label });
  }

  function goBack() {
    const previous = state.stack.pop();
    if (!previous) return;
    addMessage("חזור שלב אחד אחורה", "user");
    state.current = previous;
    const node = data.nodes[previous];
    if (!node) return;
    addMessage(formatBotMessage(node), "bot", true);
    renderOptions(node.options || []);
    renderUtility();
    scrollToBottom();
  }

  function onSubmitKeyword(event) {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    addMessage(value, "user");

    const route = findKeywordRoute(value);
    if (route) {
      renderNode(route, { silentUser: true });
      return;
    }

    addMessage(data.fallbackMessage, "bot");
    renderFallbackOptions();
    scrollToBottom();
  }

  function findKeywordRoute(value) {
    const normalized = value.toLowerCase();
    const match = (data.keywordRoutes || []).find((route) =>
      route.terms.some((term) => normalized.includes(String(term).toLowerCase()))
    );
    return match ? match.next : null;
  }

  function renderFallbackOptions() {
    const wrap = document.createElement("div");
    wrap.className = "osher-options";

    [
      { label: "חזרה להתחלה", next: data.home || "home" },
      { label: "קישורים באתר", next: "site_links" }
    ].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "osher-option";
      button.textContent = option.label;
      button.addEventListener("click", () => {
        if (option.next === "site_links") {
          addMessage(option.label, "user");
          renderSiteLinks();
        } else {
          renderNode(option.next, { userLabel: option.label, replace: true });
        }
      });
      wrap.appendChild(button);
    });

    body.appendChild(wrap);
  }

  function renderSiteLinks() {
    addMessage("אפשר להמשיך בתוך האתר. בחר עמוד אחד, ואושר יישאר כאן כשתרצה לחזור למסלול.", "bot");
    const wrap = document.createElement("div");
    wrap.className = "osher-options";

    (data.siteLinks || []).slice(0, 6).forEach((link) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "osher-option is-link";
      button.textContent = link.label;
      button.addEventListener("click", () => {
        window.location.href = resolveUrl(link.url);
      });
      wrap.appendChild(button);
    });

    body.appendChild(wrap);
    scrollToBottom();
  }

  function resolveUrl(url) {
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    return new URL(url, siteBase).href;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
