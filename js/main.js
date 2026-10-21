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

  var currentDict = translations.en;

  function applyLanguage(lang) {
    var dict = translations[lang] || translations.en;
    currentDict = dict;

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

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
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

  /* ---- Nav: underline the link for the section currently in view ---- */
  var navLinks = document.querySelectorAll(".main-nav a");
  var navTargets = Array.prototype.map.call(navLinks, function (a) {
    var el = document.querySelector(a.getAttribute("href"));
    return el && el.closest("section");
  });
  function updateNav() {
    var line = window.innerHeight * 0.35;
    var current = -1;
    navTargets.forEach(function (sec, i) {
      if (sec && sec.getBoundingClientRect().top <= line) current = i;
    });
    // Past the last linked section's bottom (e.g. testimonials, contact):
    // nothing is current.
    var last = navTargets[current];
    if (last && last.getBoundingClientRect().bottom < line) current = -1;
    navLinks.forEach(function (a, i) { a.classList.toggle("is-current", i === current); });
  }
  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  /* ---- Lazy-load and autoplay the section video near the viewport ---- */
  document.querySelectorAll("video[data-src]").forEach(function (v) {
    function start() {
      if (!v.src) v.src = v.getAttribute("data-src");
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (!("IntersectionObserver" in window)) { start(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start();
        else if (v.src) v.pause();
      });
    }, { rootMargin: "300px 0px" }).observe(v);

    /* Sound toggle: autoplay has to start muted, so visitors opt in to
       sound via the corner button or by clicking/tapping the video. */
    var wrap = v.closest(".section-video");
    var soundBtn = wrap && wrap.querySelector(".video-sound");
    if (!soundBtn) return;

    function setSound(on) {
      v.muted = !on;
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      var key = on ? "video_sound_off" : "video_sound_on";
      soundBtn.setAttribute("data-i18n-aria", key);
      if (currentDict[key] !== undefined) soundBtn.setAttribute("aria-label", currentDict[key]);
    }

    function toggleSound() {
      setSound(v.muted);
      var p = v.play();
      // If the browser refuses audible playback, fall back to muted so the
      // video keeps running rather than freezing.
      if (p && p.catch) p.catch(function () {
        setSound(false);
        var p2 = v.play();
        if (p2 && p2.catch) p2.catch(function () {});
      });
    }

    soundBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSound();
    });
    wrap.addEventListener("click", toggleSound);
  });

  /* ---- "Read more" folds: animate open/close instead of snapping ---- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Section video grows from its card size towards full width on scroll ---- */
  var growVideo = document.querySelector(".section-video");
  if (growVideo && !reduceMotion) {
    var growStart = 0, growEnd = 1, baseWidth = 0, growTicking = false;

    function measureGrow() {
      growVideo.style.width = "";
      baseWidth = growVideo.getBoundingClientRect().width;
      var top = growVideo.getBoundingClientRect().top + window.scrollY;
      var vh = window.innerHeight;
      // Start once the card's top enters the viewport (never before the
      // page's initial position), finish when it nears the top.
      growStart = Math.max(0, top - vh);
      growEnd = Math.max(growStart + 1, top - vh * 0.15);
      applyGrow();
    }

    function applyGrow() {
      growTicking = false;
      var p = (window.scrollY - growStart) / (growEnd - growStart);
      p = Math.min(1, Math.max(0, p));
      p = p * p * (3 - 2 * p); // smoothstep
      // Stop short of the screen edges: grow to 82% of the viewport width.
      var full = Math.max(baseWidth, document.documentElement.clientWidth * 0.82);
      growVideo.style.width = (baseWidth + (full - baseWidth) * p) + "px";
    }

    window.addEventListener("scroll", function () {
      if (!growTicking) { growTicking = true; requestAnimationFrame(applyGrow); }
    }, { passive: true });
    window.addEventListener("resize", measureGrow);
    window.addEventListener("load", measureGrow);
    measureGrow();
  }
  document.querySelectorAll("details.team-member-more").forEach(function (details) {
    var summary = details.querySelector("summary");
    var anim = null;

    function finish(open) {
      details.open = open;
      details.style.height = "";
      details.style.overflow = "";
      anim = null;
    }

    summary.addEventListener("click", function (e) {
      if (reduceMotion || !details.animate) return; // native toggle
      e.preventDefault();
      var opening = anim ? !details.classList.contains("is-opening") : !details.open;
      var startH = details.offsetHeight;
      if (anim) anim.cancel();
      details.style.overflow = "hidden";

      var endH;
      if (opening) {
        details.open = true;
        endH = details.scrollHeight;
        details.classList.add("is-opening");
        // Let the revealed paragraphs drift in as the panel opens.
        details.querySelectorAll("p").forEach(function (p, i) {
          p.animate(
            [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }],
            { duration: 420, delay: 80 + i * 70, easing: "ease-out", fill: "backwards" }
          );
        });
      } else {
        endH = summary.offsetHeight;
        details.classList.remove("is-opening");
      }

      anim = details.animate(
        { height: [startH + "px", endH + "px"] },
        { duration: opening ? 480 : 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      anim.onfinish = function () { finish(opening); };
    });
  });

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

  /* Two steps: basic contact details first, then their wishes. */
  var step1 = document.getElementById("formStep1");
  var step2 = document.getElementById("formStep2");
  var progressFill = document.getElementById("formProgressFill");

  function showStep(n) {
    step1.hidden = n !== 1;
    step2.hidden = n !== 2;
    progressFill.style.width = n === 1 ? "50%" : "100%";
    var first = (n === 1 ? step1 : step2).querySelector("input, select, textarea");
    if (first) first.focus({ preventScroll: true });
  }

  function goToStep2() {
    var invalid = Array.prototype.find.call(
      step1.querySelectorAll("input, select, textarea"),
      function (el) { return !el.checkValidity(); }
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    showStep(2);
  }

  document.getElementById("formNext").addEventListener("click", goToStep2);
  document.getElementById("formBack").addEventListener("click", function () {
    formError.hidden = true;
    showStep(1);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Enter pressed inside step 1 should advance, not submit.
    if (!step1.hidden) {
      goToStep2();
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var button = form.querySelector('button[type="submit"]');
    var data = new FormData(form);
    // Send the readable option labels rather than internal values
    // (e.g. "Costa Brava" instead of "costabrava") so the email reads well.
    form.querySelectorAll("select").forEach(function (sel) {
      data.set(sel.name, sel.value ? sel.options[sel.selectedIndex].text : "");
    });
    data.set("consent", "Yes");
    data.set("newsletter", form.newsletter.checked ? "Yes" : "No");

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
