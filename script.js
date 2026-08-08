document.documentElement.classList.add("has-js");

const revealItems = document.querySelectorAll(".reveal");
const backTop = document.querySelector("[data-back-top]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

if (backTop) {
  window.addEventListener("scroll", () => {
    backTop.classList.toggle("visible", window.scrollY > window.innerHeight * 0.45);
  });

  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const copyModelButtons = document.querySelectorAll("[data-copy-model]");

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

copyModelButtons.forEach((button) => {
  const defaultText = button.dataset.copyDefault || button.textContent;
  const successText = button.dataset.copySuccess || defaultText;
  const errorText = button.dataset.copyError || defaultText;
  const status = button.parentElement?.querySelector("[data-copy-status]");

  button.addEventListener("click", async () => {
    const source = button.dataset.copySrc;
    button.disabled = true;

    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Copy source unavailable");
      }

      await copyText(await response.text());
      button.textContent = successText;
      if (status) status.textContent = successText;
    } catch {
      button.textContent = errorText;
      if (status) status.textContent = errorText;
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = defaultText;
        if (status) status.textContent = "";
      }, 2200);
    }
  });
});
