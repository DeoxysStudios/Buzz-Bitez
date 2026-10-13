// Buzz Bitez – Sign up / Log in (renders into #signup-root)
(() => {
  // ---------- Config ----------
  const REQUIRE_EDU = true;          // set false to accept any email address
  const REDIRECT_AFTER = "home.html";

  const modes = {
    signup: {
      tab: "Sign up", title: "Create your account",
      desc: "Sign up with your university email to hear about free food nearby.",
      submit: "Create account",
      fields: [
        { id: "name",     label: "Full name",        type: "text",     auto: "name",         ph: "Alex Morgan" },
        { id: "email",    label: "University email", type: "email",    auto: "email",        ph: "you@university.edu" },
        { id: "password", label: "Password",         type: "password", auto: "new-password", ph: "At least 8 characters" },
        { id: "confirm",  label: "Confirm password", type: "password", auto: "new-password", ph: "Re-enter your password" },
      ],
    },
    login: {
      tab: "Log in", title: "Welcome back",
      desc: "Log in to see what's being served right now.",
      submit: "Log in",
      fields: [
        { id: "email",    label: "University email", type: "email",    auto: "email",            ph: "you@university.edu" },
        { id: "password", label: "Password",         type: "password", auto: "current-password", ph: "Your password" },
      ],
    },
  };

  let mode = "signup";
  let remember = true;
  let embedded = false;   // true when the root has data-embedded (e.g. on the home page)

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem("bb-user") || sessionStorage.getItem("bb-user")); }
    catch { return null; }
  };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ---------- Styles ----------
  const css = `
  :root{
    --bb-bg:#f9fcfc; --bb-card:#fff; --bb-line:#e2e8eb; --bb-ink:#111;
    --bb-muted:#5f6b72; --bb-red:#df0000; --bb-title:var(--bb-red); --bb-blue:#e3f9ff; --bb-blue-light:#eafbff;
  }
  #signup-root{ font-family:"DM Sans",system-ui,sans-serif; color:var(--bb-ink); background:var(--bb-bg);
    padding:0 24px 56px; min-height:100vh; box-sizing:border-box; }
  #signup-root *{ box-sizing:border-box; }
  #signup-root.su-embedded{ min-height:0; background:transparent; padding:8px 0 32px; }
  a.su-submit{ display:grid; place-items:center; text-decoration:none; }
  .su-wrap{ max-width:520px; margin:0 auto; }
  .su-title{ font-family:"Fraunces",Georgia,serif; font-weight:800; font-size:clamp(2.6rem,6vw,4rem);
    letter-spacing:-.03em; line-height:1.05; margin:0; padding-top:12px; color:var(--bb-title); }
  .su-sub{ color:var(--bb-muted); font-size:1.15rem; margin:8px 0 28px; }
  .su-tabs{ display:flex; gap:8px; margin-bottom:20px; }
  .su-tabs button{ flex:1; height:56px; border:0; border-radius:12px; background:none; color:var(--bb-ink);
    font:600 1.15rem "DM Sans",sans-serif; cursor:pointer; }
  .su-tabs button:hover{ background:var(--bb-blue); }
  .su-tabs button[aria-selected="true"]{ background:var(--bb-blue-light); color:var(--bb-ink); }
  .su-card{ background:var(--bb-card); border:1px solid var(--bb-line); border-radius:22px; padding:34px; }
  .su-h2{ font-family:"Fraunces",Georgia,serif; font-weight:800; font-size:2rem; letter-spacing:-.02em; margin:0 0 6px; }
  .su-desc{ color:var(--bb-muted); font-size:1.05rem; margin:0 0 26px; }
  .su-field{ margin-bottom:18px; }
  .su-field label{ display:block; font-weight:600; margin-bottom:8px; }
  .su-input{ position:relative; }
  .su-input input{ width:100%; height:54px; padding:0 16px; border:1px solid var(--bb-line); border-radius:12px;
    background:var(--bb-bg); color:var(--bb-ink); font:400 1rem "DM Sans",sans-serif; }
  .su-input input::placeholder{ color:var(--bb-muted); }
  .su-input input:focus{ outline:none; border-color:var(--bb-red); box-shadow:0 0 0 3px var(--bb-blue); }
  .su-input input[aria-invalid="true"]{ border-color:var(--bb-red); }
  .su-input.has-toggle input{ padding-right:72px; }
  .su-show{ position:absolute; right:8px; top:8px; height:38px; padding:0 12px; border:0; border-radius:8px;
    background:none; color:var(--bb-muted); font:600 .9rem "DM Sans",sans-serif; cursor:pointer; }
  .su-show:hover{ background:var(--bb-line); }
  .su-err{ color:var(--bb-red); font-size:.9rem; margin:6px 0 0; min-height:0; }
  .su-row{ display:flex; align-items:center; gap:16px; padding:18px 0; border-top:1px solid var(--bb-line); margin-top:24px; }
  .su-row strong{ display:block; }
  .su-row span{ color:var(--bb-muted); font-size:.95rem; }
  .su-row .su-text{ flex:1; }
  .su-switch{ width:58px; height:34px; border-radius:17px; border:0; background:#c5cdd1; position:relative;
    cursor:pointer; flex:none; transition:background .2s; }
  .su-switch::after{ content:""; position:absolute; top:4px; left:4px; width:26px; height:26px;
    border-radius:50%; background:#fff; transition:transform .2s; }
  .su-switch[aria-checked="true"]{ background:var(--bb-red); }
  .su-switch[aria-checked="true"]::after{ transform:translateX(24px); }
  .su-submit{ width:100%; height:56px; border:0; border-radius:28px; background:var(--bb-red); color:#fff;
    font:700 1.1rem "DM Sans",sans-serif; cursor:pointer; margin-top:6px; }
  .su-submit:hover{ filter:brightness(.92); }
  .su-alt{ text-align:center; color:var(--bb-muted); margin:22px 0 0; }
  .su-alt button{ border:0; background:none; color:var(--bb-red); font:600 1rem "DM Sans",sans-serif; cursor:pointer; padding:4px; }
  .su-note{ text-align:center; color:var(--bb-muted); font-size:.85rem; margin:14px 0 0; }
  #signup-root button:focus-visible{ outline:3px solid var(--bb-red); outline-offset:2px; }
  @media (max-width:520px){ .su-card{ padding:22px; } }
  @media (prefers-reduced-motion: reduce){ .su-switch, .su-switch::after{ transition:none; } }
  `;

  function injectHead() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,800&display=swap";
    document.head.appendChild(font);
  }

  // ---------- Templates ----------
  const fieldHTML = (f) => `
    <div class="su-field">
      <label for="f-${f.id}">${f.label}</label>
      <div class="su-input ${f.type === "password" ? "has-toggle" : ""}">
        <input id="f-${f.id}" name="${f.id}" type="${f.type}" autocomplete="${f.auto}"
               placeholder="${f.ph}" aria-describedby="e-${f.id}" />
        ${f.type === "password" ? `<button type="button" class="su-show" data-show="f-${f.id}" aria-label="Show password">Show</button>` : ""}
      </div>
      <p class="su-err" id="e-${f.id}" role="alert"></p>
    </div>`;

  function renderWelcome(root, user) {
    const first = esc(user.name.split(" ")[0]);
    root.innerHTML = `
      <div class="su-wrap">
        <section class="su-card">
          <h2 class="su-h2">Welcome back, ${first}</h2>
          <p class="su-desc">You're logged in as ${esc(user.email)}.</p>
          <a class="su-submit" href="alerts.html">See free food alerts</a>
          <p class="su-alt"><button type="button" data-logout>Log out</button></p>
        </section>
      </div>`;
  }

  function render(root) {
    const user = getUser();
    if (embedded && user) return renderWelcome(root, user);
    const m = modes[mode];
    root.innerHTML = `
      <div class="su-wrap">
        ${embedded ? "" : `<h1 class="su-title">${m.tab}</h1>
        <p class="su-sub">Free food on campus, straight to your pocket.</p>`}
        <div class="su-tabs" role="tablist">
          ${Object.entries(modes).map(([k, v]) =>
            `<button type="button" role="tab" data-mode="${k}" aria-selected="${k === mode}">${v.tab}</button>`).join("")}
        </div>
        <section class="su-card">
          <h2 class="su-h2">${m.title}</h2>
          <p class="su-desc">${m.desc}</p>
          <form id="auth-form" novalidate>
            ${m.fields.map(fieldHTML).join("")}
            <div class="su-row">
              <div class="su-text"><strong id="lbl-remember">Stay logged in</strong><span>Keep me signed in on this device.</span></div>
              <button type="button" class="su-switch" role="switch" id="remember" aria-labelledby="lbl-remember" aria-checked="${remember}"></button>
            </div>
            <button type="submit" class="su-submit">${m.submit}</button>
            <p class="su-err" id="e-form" role="alert" style="text-align:center"></p>
          </form>
          <p class="su-alt">${mode === "signup" ? "Already have an account?" : "New to Buzz Bitez?"}
            <button type="button" data-mode="${mode === "signup" ? "login" : "signup"}">${mode === "signup" ? "Log in" : "Sign up"}</button></p>
        </section>
        ${mode === "signup" ? `<p class="su-note">By signing up you agree to the <a href="home.html">Terms of Service</a> and <a href="home.html">Privacy Policy</a>.</p>` : ""}
      </div>`;
  }

  // ---------- Validation ----------
  const rules = {
    name:     (v) => (v.trim().length < 2 ? "Enter your full name." : ""),
    email:    (v) => !/^\S+@\S+\.\S+$/.test(v) ? "Enter a valid email address."
                   : REQUIRE_EDU && mode === "signup" && !/\.edu$/i.test(v.trim()) ? "Use your university (.edu) email." : "",
    password: (v) => (mode === "signup" && v.length < 8 ? "Use at least 8 characters." : !v ? "Enter your password." : ""),
    confirm:  (v, all) => (v !== all.password ? "Passwords don't match." : ""),
  };

  function validate(form) {
    const values = Object.fromEntries(new FormData(form));
    let firstBad = null;
    modes[mode].fields.forEach((f) => {
      const msg = rules[f.id](values[f.id] || "", values);
      const input = form.querySelector(`#f-${f.id}`);
      form.querySelector(`#e-${f.id}`).textContent = msg;
      input.setAttribute("aria-invalid", !!msg);
      if (msg && !firstBad) firstBad = input;
    });
    firstBad?.focus();
    return firstBad ? null : values;
  }

  // ---------- Submit ----------
  function submit(values, form) {
    // TODO: replace with a real call to your backend, e.g.
    // fetch("/api/" + mode, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(values) })
    const user = {
      name: values.name || (values.email.split("@")[0]),
      email: values.email.trim(),
    };
    try { (remember ? localStorage : sessionStorage).setItem("bb-user", JSON.stringify(user)); } catch {}
    form.querySelector(".su-submit").textContent = mode === "signup" ? "Account created" : "Logged in";
    setTimeout(() => {
      if (embedded) render(document.getElementById("signup-root"));   // swap form for welcome card
      else window.location.href = REDIRECT_AFTER;
    }, 600);
  }

  // ---------- Events ----------
  function bind(root) {
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-logout]")) {
        try { localStorage.removeItem("bb-user"); sessionStorage.removeItem("bb-user"); } catch {}
        mode = "login";
        render(root);
        return;
      }
      const modeBtn = e.target.closest("[data-mode]");
      if (modeBtn && modeBtn.dataset.mode !== mode) {
        mode = modeBtn.dataset.mode;
        render(root);
        root.querySelector("input")?.focus();
        return;
      }
      const show = e.target.closest("[data-show]");
      if (show) {
        const input = root.querySelector("#" + show.dataset.show);
        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        show.textContent = reveal ? "Hide" : "Show";
        show.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
        return;
      }
      const sw = e.target.closest("#remember");
      if (sw) { remember = !remember; sw.setAttribute("aria-checked", remember); }
    });

    root.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = validate(e.target);
      if (values) submit(values, e.target);
    });

    // clear a field's error as soon as the person edits it
    root.addEventListener("input", (e) => {
      if (e.target.matches(".su-input input")) {
        root.querySelector("#e-" + e.target.name).textContent = "";
        e.target.setAttribute("aria-invalid", "false");
      }
    });
  }

  // ---------- Init ----------
  function init() {
    const root = document.getElementById("signup-root");
    if (!root) return;
    embedded = root.hasAttribute("data-embedded");
    if (embedded) root.classList.add("su-embedded");
    if (location.hash === "#login") mode = "login";   // link to signup.html#login to open on Log in
    injectHead();
    render(root);
    bind(root);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();