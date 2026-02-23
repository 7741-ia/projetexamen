const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const rootDir = path.join(__dirname, "..", "..");
const dataFile = path.join(rootDir, "data.json");

function readData() {
  const raw = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
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

module.exports = {
  getAllCollectes,
  getCollecteById,
  createCollecte,
  addContribution
};
