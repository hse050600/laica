// js/common.js
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    /* ===================== HEADER SCROLL ===================== */
    const header = $(".site_header");
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle("is_scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ===================== HELPERS ===================== */
    const isDesktop = () => window.matchMedia("(min-width: 769px)").matches;
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const lockScroll = (lock) => {
      body.style.overflow = lock ? "hidden" : "";
    };

    /* ===================== SEARCH LAYER ===================== */
    const searchBtn = $(".btn_search");
    const searchLayer = $("#searchLayer");

    const openSearch = () => {
      if (!searchLayer) return;
      closeMega(true); // 검색 열면 메가메뉴 닫기

      searchLayer.classList.add("is_open");
      searchLayer.setAttribute("aria-hidden", "false");
      searchBtn?.setAttribute("aria-expanded", "true");
      lockScroll(true);

      setTimeout(() => {
        const input = $('input[type="search"]', searchLayer);
        input?.focus();
      }, 30);
    };

    const closeSearch = () => {
      if (!searchLayer) return;
      searchLayer.classList.remove("is_open");
      searchLayer.setAttribute("aria-hidden", "true");
      searchBtn?.setAttribute("aria-expanded", "false");
      lockScroll(false);
    };

    searchBtn?.addEventListener("click", () => {
      const opened = searchLayer?.classList.contains("is_open");
      opened ? closeSearch() : openSearch();
    });

    /* dim/close (search, mega 공통) */
    document.addEventListener("click", (e) => {
      const closeType = e.target?.dataset?.layerClose;
      if (!closeType) return;

      if (closeType === "search") closeSearch();
      if (closeType === "mega") closeMega(true);
    });

    /* ===================== MEGA MENU (HOVER + HAM CLICK) ===================== */
    const hamBtn = $(".btn_ham");
    const megaLayer = $("#megaLayer");
    const gnbItems = $$("#gnb .gnb_item");
    const megaCols = megaLayer ? $$(".mega_col", megaLayer) : [];

    let megaLocked = false; // 햄버거로 열면 lock(hover out으로 닫히지 않게)

    const setActiveMenu = (key) => {
      gnbItems.forEach((li) => li.classList.toggle("is_active", li.dataset.menu === key));
      megaCols.forEach((col) => col.classList.toggle("is_active", col.dataset.col === key));
    };

    const openMega = ({ lock = false, key = null } = {}) => {
      if (!header || !megaLayer) return;

      closeSearch(); // 메가 열면 검색 닫기

      header.classList.add("mega_open");
      megaLayer.setAttribute("aria-hidden", "false");
      hamBtn?.setAttribute("aria-expanded", "true");

      if (lock) megaLocked = true;

      const useKey = key || gnbItems[0]?.dataset.menu;
      if (useKey) setActiveMenu(useKey);

      // 모바일에서는 overlay라 스크롤 잠금
      if (isMobile()) lockScroll(true);
    };

    function closeMega(unlock = true) {
      if (!header || !megaLayer) return;

      header.classList.remove("mega_open");
      megaLayer.setAttribute("aria-hidden", "true");
      hamBtn?.setAttribute("aria-expanded", "false");

      if (unlock) megaLocked = false;

      // active 해제
      gnbItems.forEach((li) => li.classList.remove("is_active"));
      megaCols.forEach((col) => col.classList.remove("is_active"));

      lockScroll(false);
    }

    //  햄버거 클릭: hover 열린 상태를 “고정(open/close toggle)”으로 만들어줌
    hamBtn?.addEventListener("click", () => {
      if (!header || !megaLayer) return;

      const opened = header.classList.contains("mega_open");
      if (!opened) {
        openMega({ lock: true });
        return;
      }

      // 열려있는 상태면:
      // - hover로만 열린 상태였다면 => 클릭하면 고정(lock)
      // - 이미 lock 상태면 => 닫기
      if (!megaLocked) {
        megaLocked = true; // hover 열린 상태를 “클릭 고정”
      } else {
        closeMega(true);
      }
    });


    // 데스크탑에서 lock 상태일 때 바깥 클릭하면 닫기
    document.addEventListener("click", (e) => {
      if (!isDesktop()) return;
      if (!megaLocked) return;
      if (!header?.classList.contains("mega_open")) return;

      // header 밖 클릭이면 닫기
      if (!header.contains(e.target)) closeMega(true);
    });

    /* ESC */
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      if (searchLayer?.classList.contains("is_open")) closeSearch();
      if (header?.classList.contains("mega_open")) closeMega(true);
    });

    /* ===================== HERO SLIDER (VANILLA) ===================== */
    class SimpleSlider {
      constructor(root, { interval = 6500 } = {}) {
        this.root = root;
        this.wrapper = root.querySelector(".swiper_wrapper") || root.querySelector(".swiper-wrapper");
        if (!this.wrapper) return;

        this.slides = Array.from(this.wrapper.children);
        if (this.slides.length < 2) return;

        this.prevBtn = root.querySelector(".slider_btn.prev");
        this.nextBtn = root.querySelector(".slider_btn.next");
        this.pagination = root.querySelector(".slider_pagination");

        this.index = 0;
        this.timer = null;
        this.interval = interval;

        this.init();
      }

      init() {
        this.bullets = [];
        if (this.pagination) {
          this.pagination.innerHTML = "";
          this.slides.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "dot" + (i === 0 ? " is_active" : "");
            dot.setAttribute("aria-label", `${i + 1}번 슬라이드`);
            dot.addEventListener("click", () => this.goTo(i));
            this.pagination.appendChild(dot);
            this.bullets.push(dot);
          });
        }

        this.prevBtn?.addEventListener("click", () => this.prev());
        this.nextBtn?.addEventListener("click", () => this.next());

        this.root.addEventListener("mouseenter", () => this.stop());
        this.root.addEventListener("mouseleave", () => this.start());
        this.root.addEventListener("focusin", () => this.stop());
        this.root.addEventListener("focusout", () => this.start());

        this.start();
      }

      update() {
        this.wrapper.style.transform = `translateX(${-this.index * 100}%)`;
        if (this.bullets.length) {
          this.bullets.forEach((b, i) => b.classList.toggle("is_active", i === this.index));
        }
      }

      goTo(i) {
        const len = this.slides.length;
        this.index = (i + len) % len;
        this.update();
      }

      next() { this.goTo(this.index + 1); }
      prev() { this.goTo(this.index - 1); }

      start() {
        if (this.interval <= 0) return;
        this.stop();
        this.timer = setInterval(() => this.next(), this.interval);
      }

      stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    $$('[data-slider="hero"]').forEach((el) => new SimpleSlider(el, { interval: 7000 }));

    /* ===================== MOVIE CHART ARROWS (SCROLL) ===================== */
    const chartSlider = $(".chart_slider");
    const arrowLeft = $(".chart_arrow.left");
    const arrowRight = $(".chart_arrow.right");

    const getScrollAmount = () => {
      const first = chartSlider?.querySelector(".chart_item");
      if (!first) return 280;

      const w = first.getBoundingClientRect().width;
      const list = chartSlider.querySelector(".chart_list");
      let gap = 0;

      if (list) {
        const style = window.getComputedStyle(list);
        gap = parseFloat(style.gap || style.columnGap || "0") || 0;
      }
      return w + gap;
    };

    const scrollByAmount = (dir) => {
      if (!chartSlider) return;
      chartSlider.scrollBy({ left: dir * getScrollAmount(), behavior: "smooth" });
    };

    arrowLeft?.addEventListener("click", () => scrollByAmount(-1));
    arrowRight?.addEventListener("click", () => scrollByAmount(1));

    chartSlider?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollByAmount(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); scrollByAmount(1); }
    });

    /* ===================== TABS (MOVIE CHART) ===================== */
    const tabs = $$(".tab_group .tab");
    const panels = $$(".tab_panels .tab_panel");

    if (tabs.length && panels.length) {
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const key = tab.dataset.tab;

          tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle("is_active", active);
            t.setAttribute("aria-selected", active ? "true" : "false");
          });

          panels.forEach((p) => p.classList.toggle("is_active", p.dataset.panel === key));
        });
      });
    }

    /* ===================== EVENT TICKER (VERTICAL LOOP) ===================== */
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      document.querySelectorAll("[data-vertical-ticker]").forEach((track) => {
        const text = track.querySelector(".ticker_text");
        if (!text) return;

        // 1) 같은 텍스트를 하나 더 복제해서 끊김 없는 루프 만들기
        const clone = text.cloneNode(true);
        track.appendChild(clone);

        let loopH = 0;               // 원본 텍스트 블록 높이
        let y = 0;                   // 현재 Y 오프셋(px)
        const speed = Number(track.dataset.speed || 40); // px per second
        let last = performance.now();

        const measure = () => {
          // 원본 1개 높이만 기준으로 루프 길이 설정
          loopH = text.getBoundingClientRect().height;

          // 아래로 흐르게 만들려면 -loopH에서 시작해서 0까지 내려오게
          y = -loopH;
          track.style.setProperty("--ty", `${y}px`);
        };

        const tick = (now) => {
          const dt = (now - last) / 1000;
          last = now;

          y += speed * dt;         //  아래로 이동
          if (y >= 0) y = -loopH;  //  끝까지 내려오면 다시 위로 점프(하지만 같은 텍스트라 자연스러움)

          track.style.setProperty("--ty", `${y}px`);
          requestAnimationFrame(tick);
        };

        // 폰트 로딩 후 높이가 변할 수 있어서 fonts.ready도 고려
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            measure();
            requestAnimationFrame(tick);
          });
        } else {
          measure();
          requestAnimationFrame(tick);
        }

        window.addEventListener("resize", () => {
          measure();
        }, { passive: true });
      });
    }

    /* ===================== MAP BUTTONS ===================== */
    const mapBtns = $$(".map_actions .map_btn");
    const mapPanels = $$(".map_info");

    if (mapBtns.length && mapPanels.length) {
      mapBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.map;

          mapBtns.forEach((b) => b.classList.toggle("is_active", b === btn));
          mapPanels.forEach((p) => { p.hidden = p.dataset.mapPanel !== key; });
        });
      });
    }

    /* ===================== NOW PLAYING DATE BAR ===================== */
    const dateBar = document.querySelector(".now_playing .date_bar");
    if (dateBar) {
      const dateBtns = Array.from(dateBar.querySelectorAll(".date_btn"));

      dateBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          dateBtns.forEach((b) => {
            const active = b === btn;
            b.classList.toggle("is_active", active);
            b.setAttribute("aria-selected", active ? "true" : "false");
          });

          btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      });
    }
  });
})();
