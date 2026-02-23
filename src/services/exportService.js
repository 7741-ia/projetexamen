const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const rootDir = path.join(__dirname, "..", "..");
const exportsDir = path.join(rootDir, "exports");

function sanitizeFileName(value) {
  return String(value || "collecte")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "_")
    .slice(0, 60);
}

async function exportCollecteToPdf(collecte) {
  const fileName = `${sanitizeFileName(collecte.name)}_${collecte.id}.pdf`;
  const filePath = path.join(exportsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(20).text("CollecteX - Rapport de collecte", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Nom: ${collecte.name}`);
    doc.text(`Type: ${collecte.type}`);
    doc.text(`Date: ${collecte.date}`);
    doc.text(`Total: ${collecte.total.toLocaleString("fr-FR")} FC`);
    doc.moveDown();
    doc.fontSize(14).text("Contributions");
    doc.moveDown(0.5);

    if (!collecte.contributions.length) {
      doc.fontSize(12).text("Aucune contribution.");
    } else {
      collecte.contributions.forEach((contribution, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${contribution.contributorName} - ${Number(
              contribution.amount
            ).toLocaleString("fr-FR")} FC`
          );
      });
    }

    doc.end();
    stream.on("finish", () => resolve({ fileName, filePath }));
    stream.on("error", reject);
  });
}

async function exportCollecteToExcel(collecte) {
  const fileName = `${sanitizeFileName(collecte.name)}_${collecte.id}.xlsx`;
  const filePath = path.join(exportsDir, fileName);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Collecte");

  sheet.columns = [
    { header: "Nom collecte", key: "collecteName", width: 24 },
    { header: "Type", key: "type", width: 20 },
    { header: "Date", key: "date", width: 16 },
    { header: "Contributeur", key: "contributor", width: 26 },
    { header: "Montant", key: "amount", width: 14 }
  ];

  if (collecte.contributions.length) {
    collecte.contributions.forEach((contribution) => {
      sheet.addRow({
        collecteName: collecte.name,
        type: collecte.type,
        date: collecte.date,
        contributor: contribution.contributorName,
        amount: Number(contribution.amount)
      });
    });
  } else {
    sheet.addRow({
      collecteName: collecte.name,
      type: collecte.type,
      date: collecte.date,
      contributor: "Aucune contribution",
      amount: 0
    });
  }

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath };
}

module.exports = {
  exportCollecteToPdf,
  exportCollecteToExcel
};
