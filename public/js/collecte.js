const form = document.getElementById("contributionForm");
const feedback = document.getElementById("feedback");
const totalValue = document.getElementById("totalValue");
const contributionsBody = document.getElementById("contributionsBody");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const collecteId = form.dataset.collecteId;
    const contributorName = document.getElementById("contributorName").value.trim();
    const amount = document.getElementById("amount").value;

    try {
      const response = await fetch(`/collecte/${collecteId}/contribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributorName, amount })
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Echec de l'ajout");
      }

      showFeedback("Contribution ajoutee avec succes.", true);
      updateTable(payload.collecte);
      form.reset();
    } catch (error) {
      showFeedback(error.message, false);
    }
  });
}

function showFeedback(message, isSuccess) {
  feedback.classList.remove("hidden", "error", "success");
  feedback.classList.add(isSuccess ? "success" : "error");
  feedback.textContent = message;
}

function updateTable(collecte) {
  const formattedTotal = Number(collecte.total).toLocaleString("fr-FR");
  totalValue.textContent = `${formattedTotal} FC`;

  contributionsBody.innerHTML = "";
  if (!collecte.contributions.length) {
    contributionsBody.innerHTML =
      '<tr><td colspan="2" class="muted">Aucune contribution pour le moment.</td></tr>';
    return;
  }

  collecte.contributions.forEach((contribution) => {
    const tr = document.createElement("tr");
    const contributorTd = document.createElement("td");
    const amountTd = document.createElement("td");

    contributorTd.textContent = contribution.contributorName;
    amountTd.textContent = `${Number(contribution.amount).toLocaleString("fr-FR")} FC`;

    tr.appendChild(contributorTd);
    tr.appendChild(amountTd);
    contributionsBody.appendChild(tr);
  });
}
