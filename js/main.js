/* The Pearl Compass landing page interactions */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var STORAGE_KEY = "tpc_lang";

  function detectDefaultLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && translations[stored]) return stored;
    var nav = (navigator.language || "en").toLowerCase();
    if (nav.indexOf("nl") === 0) return "nl";
    if (nav.indexOf("es") === 0) return "es";
    return "en";
  }

  /* Builds the testimonial marquee for the given language's review list,
     duplicating the set once so the track can loop seamlessly at -50%. */
  function renderTestimonials(list) {
    var track = document.getElementById("testimonialTrack");
    if (!track || !list || !list.length) return;

    track.style.animation = "none";
    track.innerHTML = "";

    for (var s = 0; s < 2; s++) {
      list.forEach(function (t) {
        var fig = document.createElement("figure");
        fig.className = "testimonial-card";

        var bq = document.createElement("blockquote");
        bq.textContent = t.text;

        var cap = document.createElement("figcaption");
        var name = document.createElement("span");
        name.className = "t-name";
        name.textContent = t.name;
        var loc = document.createElement("span");
        loc.className = "t-loc";
        loc.textContent = t.loc;
        cap.appendChild(name);
        cap.appendChild(loc);

        fig.appendChild(bq);
        fig.appendChild(cap);
        track.appendChild(fig);
      });
    }

    var duration = Math.max(list.length * 24, 48);
    void track.offsetWidth; /* force reflow so the animation restarts cleanly */
    track.style.animation = "testimonial-scroll " + duration + "s linear infinite";
  }

  function applyLanguage(lang) {
    var dict = translations[lang] || translations.en;

    document.documentElement.setAttribute("lang", lang);
    if (dict.meta_title) document.title = dict.meta_title;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    renderTestimonials(dict.testimonials);

    var fLanguage = document.getElementById("fLanguage");
    if (fLanguage && !fLanguage.dataset.userSet && ["en", "nl", "es"].indexOf(lang) !== -1) {
      fLanguage.value = lang;
    }

    localStorage.setItem(STORAGE_KEY, lang);
  }

  /* ---- Language menu: globe icon toggles a small dropdown ---- */
  var langSwitch = document.getElementById("langSwitch");
  var langToggle = document.getElementById("langToggle");

  function closeLangMenu() {
    langSwitch.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  }
  function toggleLangMenu() {
    var open = langSwitch.classList.toggle("open");
    langToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  langToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleLangMenu();
  });
  document.addEventListener("click", function (e) {
    if (!langSwitch.contains(e.target)) closeLangMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLangMenu();
  });

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLanguage(btn.getAttribute("data-lang"));
      closeLangMenu();
    });
  });

  applyLanguage(detectDefaultLang());

  /* ---- Sticky header shadow on scroll ---- */
  var header = document.getElementById("siteHeader");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Reveal-on-scroll ---- */
  var revealTargets = document.querySelectorAll(
    ".risk-item, .persona-card, .process-item, .region-card, .testimonial-carousel, .about-media, .about-copy, .section-head"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---- Process steps: scroll-driven progress rail ---- */
  (function () {
    var list = document.querySelector(".process-list");
    var track = document.getElementById("processLine");
    var fill = document.getElementById("processLineFill");
    var icon = document.querySelector(".process-line-icon");
    if (!list || !track || !fill || !icon) return;

    var nums = list.querySelectorAll(".process-num");
    if (nums.length < 2) return;

    var items = list.querySelectorAll(".process-item");

    var trackTop = 0;
    var trackHeight = 0;

    function layout() {
      // Sum offsetTop up to .process-list rather than using bounding rects:
      // offsets ignore CSS transforms, so the active card's pop (and the
      // reveal slide-in) can't skew the rail. Transformed cards become
      // their number's offsetParent, hence walking the chain.
      function topIn(el) {
        var y = 0;
        while (el && el !== list) { y += el.offsetTop; el = el.offsetParent; }
        return y;
      }
      var first = nums[0];
      var last = nums[nums.length - 1];
      trackTop = topIn(first) + first.offsetHeight / 2;
      trackHeight = (topIn(last) + last.offsetHeight / 2) - trackTop;
      track.style.top = trackTop + "px";
      track.style.height = trackHeight + "px";
    }

    function updateProgress() {
      // Reference point is the viewport's vertical centre, matching where
      // .process-line-icon-wrap (position:sticky; top:50vh) pins the icon.
      // That keeps the fill's leading edge visually meeting the icon
      // instead of the icon appearing to travel down the rail.
      var rect = track.getBoundingClientRect();
      var center = window.innerHeight / 2;
      var progress = (center - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      fill.style.height = (progress * 100) + "%";

      // Whichever step's row the icon is currently level with (using its
      // real position — sticky-pinned mid-scroll, or its resting position
      // at the top/bottom of the rail before/after that) gets marked active.
      var iconY = icon.getBoundingClientRect().top;
      var closest = null;
      var closestDist = Infinity;
      items.forEach(function (item) {
        var itemRect = item.getBoundingClientRect();
        var itemCenter = itemRect.top + itemRect.height / 2;
        var dist = Math.abs(itemCenter - iconY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = item;
        }
      });
      items.forEach(function (item) {
        item.classList.toggle("is-active", item === closest);
      });
    }

    layout();
    updateProgress();
    window.addEventListener("load", function () { layout(); updateProgress(); });
    window.addEventListener("resize", function () { layout(); updateProgress(); });
    window.addEventListener("scroll", updateProgress, { passive: true });
  })();

  /* ---- Lead form: posted to Web3Forms, which emails it to Lotte ---- */
  var form = document.getElementById("leadForm");
  var fields = document.getElementById("formFields");
  var success = document.getElementById("formSuccess");
  var formError = document.getElementById("formError");

  var fLanguageField = document.getElementById("fLanguage");
  if (fLanguageField) {
    fLanguageField.addEventListener("change", function () {
      fLanguageField.dataset.userSet = "1";
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var button = form.querySelector('button[type="submit"]');
    var data = new FormData(form);
    // Send the readable option labels rather than internal values
    // (e.g. "Costa Brava" instead of "costabrava") so the email reads well.
    form.querySelectorAll("select").forEach(function (sel) {
      data.set(sel.name, sel.options[sel.selectedIndex].text);
    });
    data.set("consent", "Yes");

    button.disabled = true;
    formError.hidden = true;

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.success) throw new Error(json.message || "Submission failed");
        fields.hidden = true;
        success.hidden = false;
      })
      .catch(function () {
        formError.hidden = false;
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
