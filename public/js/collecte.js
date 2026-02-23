const form = document.getElementById("contributionForm");
const feedback = document.getElementById("feedback");
const totalValue = document.getElementById("totalValue");
const contributionsBody = document.getElementById("contributionsBody");
const memberSelect = document.getElementById("memberId");
const contributorInput = document.getElementById("contributorName");

if (memberSelect && contributorInput) {
  memberSelect.addEventListener("change", () => {
    const option = memberSelect.options[memberSelect.selectedIndex];
    if (memberSelect.value) {
      contributorInput.value = option ? option.textContent : "";
      contributorInput.readOnly = true;
    } else {
      contributorInput.readOnly = false;
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const collecteId = form.dataset.collecteId;
    const contributorName = contributorInput ? contributorInput.value.trim() : "";
    const amount = document.getElementById("amount").value;
    const memberId = memberSelect ? memberSelect.value : "";

    if (!memberId && !contributorName) {
      showFeedback("Nom du contributeur obligatoire si aucune personne n'est selectionnee.", false);
      return;
    }

    try {
      const response = await fetch(`/collecte/${collecteId}/contribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributorName, amount, memberId })
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
      '<tr><td colspan="3" class="muted">Aucune contribution pour le moment.</td></tr>';
    return;
  }

  collecte.contributions.forEach((contribution) => {
    const tr = document.createElement("tr");
    const contributorTd = document.createElement("td");
    const amountTd = document.createElement("td");
    const memberTd = document.createElement("td");

    contributorTd.textContent = contribution.contributorName;
    amountTd.textContent = `${Number(contribution.amount).toLocaleString("fr-FR")} FC`;
    memberTd.textContent = contribution.memberId ? "Oui" : "Non";

    tr.appendChild(contributorTd);
    tr.appendChild(amountTd);
    tr.appendChild(memberTd);
    contributionsBody.appendChild(tr);
  });
}
