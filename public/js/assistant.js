const assistantForm = document.getElementById("assistantForm");
const assistantAnswer = document.getElementById("assistantAnswer");

if (assistantForm && assistantAnswer) {
  assistantForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = String(document.getElementById("assistantQuestion").value || "").trim();
    if (!question) {
      assistantAnswer.textContent = "Ecris une question.";
      return;
    }

    assistantAnswer.textContent = "Traitement en cours...";

    try {
      const response = await fetch("/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Erreur assistant");
      }

      assistantAnswer.textContent = payload.answer;
      assistantAnswer.classList.remove("muted");
    } catch (error) {
      assistantAnswer.textContent = error.message;
    }
  });
}
