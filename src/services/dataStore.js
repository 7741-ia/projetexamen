const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const rootDir = path.join(__dirname, "..", "..");
const dataFile = path.join(rootDir, "data.json");

function readData() {
  const raw = fs.readFileSync(dataFile, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.collectes)) {
    parsed.collectes = [];
  }
  if (!Array.isArray(parsed.users)) {
    parsed.users = [];
  }

  return parsed;
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash || typeof passwordHash !== "string") {
    return false;
  }

  const [algorithm, salt, storedKeyHex] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedKeyHex) {
    return false;
  }

  const derivedKey = crypto.scryptSync(String(password), salt, 64);
  const storedKey = Buffer.from(storedKeyHex, "hex");
  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
}

function getAllCollectes() {
  const data = readData();
  return data.collectes;
}

function getCollecteById(id) {
  return getAllCollectes().find((collecte) => collecte.id === id) || null;
}

function createCollecte({ name, type, date }) {
  const data = readData();
  const newCollecte = {
    id: uuidv4(),
    name,
    type,
    date,
    contributions: [],
    total: 0,
    createdAt: new Date().toISOString()
  };

  data.collectes.unshift(newCollecte);
  writeData(data);
  return newCollecte;
}

function addContribution(collecteId, { contributorName, amount }) {
  const data = readData();
  const collecte = data.collectes.find((item) => item.id === collecteId);

  if (!collecte) {
    return null;
  }

  const numericAmount = Number(amount) || 0;
  const contribution = {
    id: uuidv4(),
    contributorName,
    amount: numericAmount,
    createdAt: new Date().toISOString()
  };

  collecte.contributions.push(contribution);
  // Recompute total from source-of-truth list to avoid drift.
  collecte.total =
    collecte.contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  writeData(data);

  return collecte;
}

function getUserByUsername(username) {
  const data = readData();
  return (
    data.users.find(
      (user) => String(user.username).toLowerCase() === String(username).toLowerCase()
    ) || null
  );
}

function authenticateUser(username, password) {
  const data = readData();
  const user = data.users.find(
    (item) => String(item.username).toLowerCase() === String(username).toLowerCase()
  );

  if (!user) {
    return null;
  }

  if (verifyPassword(password, user.passwordHash)) {
    return user;
  }

  // Backward compatibility: migrate legacy plaintext password on first successful login.
  if (typeof user.password === "string" && password === user.password) {
    user.passwordHash = hashPassword(password);
    delete user.password;
    writeData(data);
    return user;
  }

  return null;
}

function createUser({ username, password }) {
  const data = readData();
  const normalizedUsername = String(username || "").trim();

  const userExists = data.users.some(
    (user) =>
      String(user.username).toLowerCase() === normalizedUsername.toLowerCase()
  );
  if (userExists) {
    return { created: false, reason: "exists" };
  }

  const newUser = {
    id: uuidv4(),
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  data.users.unshift(newUser);
  writeData(data);
  return { created: true, user: newUser };
}

module.exports = {
  getAllCollectes,
  getCollecteById,
  createCollecte,
  addContribution,
  getUserByUsername,
  authenticateUser,
  createUser
};
