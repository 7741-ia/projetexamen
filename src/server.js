const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const pagesRouter = require("./routes/pages");

const app = express();
const rootDir = path.join(__dirname, "..");
const exportsDir = path.join(rootDir, "exports");

// Ensure export directory exists for PDF/Excel generation.
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "collectex-session-secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static(path.join(rootDir, "public")));

app.use("/", pagesRouter);

app.use((req, res) => {
  res.status(404).render("404", { title: "Page introuvable" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`CollecteX disponible sur http://localhost:${PORT}`);
});
