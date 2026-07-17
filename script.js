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
