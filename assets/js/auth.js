(function (window) {
  const USER_KEY = "inventario360_users_v1";
  const SESSION_KEY = "inventario360_session_v1";
  const NOTICE_KEY = "inventario360_notice";
  const DEFAULT_PANEL = "Menu.html";
  const SEED_USERS = [
    {
      nombre: "Administrador demo",
      usuario: "admin",
      email: "admin@demo.com",
      contrasena: "admin123",
    },
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }

  function sanitizeUser(raw) {
    if (!raw || typeof raw !== "object") return null;
    const nombre = String(raw.nombre ?? "").trim();
    const usuario = String(raw.usuario ?? "").trim();
    const email = String(raw.email ?? "").trim().toLowerCase();
    const contrasena = String(raw.contrasena ?? "");
    if (!nombre || !usuario || !contrasena) return null;
    return { nombre, usuario, email, contrasena };
  }

  function loadUsers() {
    const raw = safeParse(localStorage.getItem(USER_KEY)) ?? [];
    const list = Array.isArray(raw)
      ? raw.map(sanitizeUser).filter(Boolean)
      : [];
    if (!list.length) {
      list.push(...SEED_USERS);
      persistUsers(list);
    }
    return list;
  }

  function persistUsers(list) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(list));
    } catch (_) {
      // noop
    }
  }

  function persistSession(user) {
    const session = {
      usuario: user.usuario,
      nombre: user.nombre,
      email: user.email,
      ts: Date.now(),
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (_) {
      // noop
    }
  }

  function getSession() {
    const data = safeParse(localStorage.getItem(SESSION_KEY));
    if (!data || typeof data !== "object" || !data.usuario) return null;
    return {
      usuario: String(data.usuario),
      nombre: String(data.nombre ?? data.usuario),
      email: String(data.email ?? ""),
      ts: Number(data.ts) || Date.now(),
    };
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {
      // noop
    }
  }

  function registerUser(payload = {}) {
    const nombre = String(payload.nombre ?? "").trim();
    const usuario = String(payload.usuario ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const contrasena = String(payload.contrasena ?? "");
    const confirmar = String(payload.confirmar ?? payload.contrasena ?? "");

    if (nombre.length < 3) {
      return { ok: false, message: "Ingresa un nombre completo v\u00e1lido." };
    }
    if (usuario.length < 3) {
      return { ok: false, message: "El usuario debe tener al menos 3 caracteres." };
    }
    if (!emailRegex.test(email)) {
      return { ok: false, message: "Ingresa un correo electr\u00f3nico v\u00e1lido." };
    }
    if (contrasena.length < 6) {
      return { ok: false, message: "La contrase\u00f1a debe tener al menos 6 caracteres." };
    }
    if (contrasena !== confirmar) {
      return { ok: false, message: "Las contrase\u00f1as no coinciden." };
    }

    const users = loadUsers();
    const existsUser = users.some(
      (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
    );
    if (existsUser) {
      return { ok: false, message: "El usuario ya est\u00e1 registrado." };
    }
    const existsEmail = users.some(
      (u) => u.email && u.email.toLowerCase() === email
    );
    if (existsEmail) {
      return { ok: false, message: "El correo ya se encuentra registrado." };
    }

    const user = { nombre, usuario, email, contrasena };
    users.push(user);
    persistUsers(users);
    return { ok: true, user: omitPassword(user) };
  }

  function loginUser(payload = {}) {
    const username = String(payload.usuario ?? "").trim();
    const password = String(payload.contrasena ?? "");
    if (!username || !password) {
      return { ok: false, message: "Ingresa usuario y contrase\u00f1a." };
    }
    const users = loadUsers();
    const user = users.find(
      (u) => u.usuario.toLowerCase() === username.toLowerCase()
    );
    if (!user) {
      return { ok: false, message: "Usuario no registrado." };
    }
    if (user.contrasena !== password) {
      return { ok: false, message: "Contrase\u00f1a incorrecta." };
    }
    persistSession(user);
    return { ok: true, user: omitPassword(user) };
  }

  function requireSession(options = {}) {
    const session = getSession();
    if (session) return session;
    if (options.message) {
      try {
        sessionStorage.setItem(NOTICE_KEY, options.message);
      } catch (_) {
        // noop
      }
    }
    const redirectTo = options.redirectTo || "login.html";
    window.location.href = redirectTo;
    return null;
  }

  function ensureGuest(options = {}) {
    const session = getSession();
    if (!session) return null;
    const redirectTo = options.redirectTo || DEFAULT_PANEL;
    window.location.href = redirectTo;
    return session;
  }

  function goToPanel(path = DEFAULT_PANEL) {
    window.location.href = path;
  }

  function popNotice() {
    try {
      const msg = sessionStorage.getItem(NOTICE_KEY);
      if (msg) sessionStorage.removeItem(NOTICE_KEY);
      return msg;
    } catch (_) {
      return null;
    }
  }

  function omitPassword(user) {
    return user
      ? {
          nombre: user.nombre,
          usuario: user.usuario,
          email: user.email,
        }
      : null;
  }

  window.Auth = {
    registerUser,
    loginUser,
    currentUser: getSession,
    logout,
    requireSession,
    ensureGuest,
    goToPanel,
    popNotice,
    listUsers: () => loadUsers().map(omitPassword),
  };
})(window);
