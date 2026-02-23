const express = require("express");
const path = require("path");
const fs = require("fs");
const { requireAuth } = require("../middleware/auth");
const {
  getAllCollectes,
  getCollecteById,
  createCollecte,
  addContribution,
  authenticateUser,
  createUser
} = require("../services/dataStore");
const {
  exportCollecteToPdf,
  exportCollecteToExcel
} = require("../services/exportService");

const router = express.Router();
const rootDir = path.join(__dirname, "..", "..");
const configPath = path.join(rootDir, "app-config.json");

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

function normalizeType(type) {
  const allowed = ["offrande", "tontine", "contribution", "autre"];
  return allowed.includes(type) ? type : "autre";
}

router.get("/", (req, res) => {
  return res.redirect("/login");
});

router.get("/login", (req, res) => {
  if (req.session?.isAuthenticated) {
    return res.redirect("/dashboard");
  }

  return res.render("login", {
    title: "Connexion",
    error: null
  });
});

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const config = readConfig();
  const validAdmin =
    username === config.admin.username && password === config.admin.password;
  const validRegisteredUser = Boolean(authenticateUser(username, password));

  if (!validAdmin && !validRegisteredUser) {
    return res.status(401).render("login", {
      title: "Connexion",
      error: "Identifiants invalides."
    });
  }

  req.session.isAuthenticated = true;
  req.session.adminUsername = username;
  return res.redirect("/dashboard");
});

router.get("/register", (req, res) => {
  if (req.session?.isAuthenticated) {
    return res.redirect("/dashboard");
  }

  return res.render("register", {
    title: "Inscription",
    error: null
  });
});

router.post("/register", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!username || !password) {
    return res.status(400).render("register", {
      title: "Inscription",
      error: "Nom d'utilisateur et mot de passe obligatoires."
    });
  }

  if (username.length < 3) {
    return res.status(400).render("register", {
      title: "Inscription",
      error: "Le nom d'utilisateur doit avoir au moins 3 caracteres."
    });
  }

  if (password.length < 4) {
    return res.status(400).render("register", {
      title: "Inscription",
      error: "Le mot de passe doit avoir au moins 4 caracteres."
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render("register", {
      title: "Inscription",
      error: "La confirmation du mot de passe ne correspond pas."
    });
  }

  const result = createUser({ username, password });
  if (!result.created) {
    return res.status(409).render("register", {
      title: "Inscription",
      error: "Ce nom d'utilisateur existe deja."
    });
  }

  req.session.isAuthenticated = true;
  req.session.adminUsername = result.user.username;
  return res.redirect("/dashboard");
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

router.get("/dashboard", requireAuth, (req, res) => {
  const collectes = getAllCollectes();
  const totalGlobal = collectes.reduce((sum, collecte) => sum + Number(collecte.total || 0), 0);

  return res.render("dashboard", {
    title: "Dashboard",
    collectesCount: collectes.length,
    totalGlobal,
    latestCollectes: collectes.slice(0, 5)
  });
});

router.get("/collecte", requireAuth, (req, res) => {
  const collectes = getAllCollectes();
  const selectedId = req.query.id || (collectes[0] && collectes[0].id);
  const selectedCollecte = selectedId ? getCollecteById(selectedId) : null;

  return res.render("collecte", {
    title: "Collecte",
    collectes,
    selectedCollecte,
    success: null,
    error: null
  });
});

router.post("/collecte/create", requireAuth, (req, res) => {
  const { name, type, date } = req.body;
  if (!name || !date) {
    const collectes = getAllCollectes();
    return res.status(400).render("collecte", {
      title: "Collecte",
      collectes,
      selectedCollecte: null,
      success: null,
      error: "Le nom et la date sont obligatoires."
    });
  }

  const collecte = createCollecte({
    name: name.trim(),
    type: normalizeType(type),
    date
  });

  return res.redirect(`/collecte?id=${collecte.id}`);
});

router.post("/collecte/:id/contribution", requireAuth, (req, res) => {
  const { contributorName, amount } = req.body;
  const parsedAmount = Number(amount);

  if (!contributorName || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Nom et montant valide obligatoires."
    });
  }

  const collecte = addContribution(req.params.id, {
    contributorName: contributorName.trim(),
    amount: parsedAmount
  });

  if (!collecte) {
    return res.status(404).json({
      success: false,
      message: "Collecte introuvable."
    });
  }

  return res.json({
    success: true,
    collecte
  });
});

router.get("/collecte/:id/export/pdf", requireAuth, async (req, res) => {
  const collecte = getCollecteById(req.params.id);
  if (!collecte) {
    return res.status(404).send("Collecte introuvable");
  }

  const result = await exportCollecteToPdf(collecte);
  return res.download(result.filePath, result.fileName);
});

router.get("/collecte/:id/export/excel", requireAuth, async (req, res) => {
  const collecte = getCollecteById(req.params.id);
  if (!collecte) {
    return res.status(404).send("Collecte introuvable");
  }

  const result = await exportCollecteToExcel(collecte);
  return res.download(result.filePath, result.fileName);
});

router.get("/historique", requireAuth, (req, res) => {
  const collectes = getAllCollectes();
  return res.render("historique", {
    title: "Historique",
    collectes
  });
});

router.get("/apropos", requireAuth, (req, res) => {
  const config = readConfig();
  return res.render("apropos", {
    title: "A propos",
    about: config.about,
    monetization: config.monetization
  });
});

module.exports = router;
