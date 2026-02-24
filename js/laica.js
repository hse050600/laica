// js/laica.js
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const rows = Array.from(document.querySelectorAll(".system_rows .system_row"));
    if (!rows.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const setActive = (target) => {
      rows.forEach((r) => r.classList.toggle("is_active", r === target));
    };

    // 기본 활성
    setActive(rows[0]);

    const io = new IntersectionObserver(
      (entries) => {
        // 가장 많이 보이는 항목을 활성화
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target) setActive(visible.target);
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    rows.forEach((row) => io.observe(row));
  });
})();