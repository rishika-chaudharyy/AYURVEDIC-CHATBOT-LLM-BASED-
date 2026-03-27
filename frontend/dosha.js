let chart;

function generateProfile() {

  let v = 0, p = 0, k = 0;

  for (let i = 1; i <= 5; i++) {
    let val = document.querySelector(`input[name=q${i}]:checked`);
    if (!val) return alert("Please answer all questions");

    if (val.value === "vata") v++;
    if (val.value === "pitta") p++;
    if (val.value === "kapha") k++;
  }

  let total = v + p + k;

  let vata = Math.round(v / total * 100);
  let pitta = Math.round(p / total * 100);
  let kapha = Math.round(k / total * 100);

  // chart fix
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels: ["Vata", "Pitta", "Kapha"],
      datasets: [{
        data: [vata, pitta, kapha],
        backgroundColor: ["#7b1fa2", "#d32f2f", "#388e3c"]
      }]
    }
  });

  let dom = vata > pitta && vata > kapha ? "Vata" :
    pitta > kapha ? "Pitta" : "Kapha";

  // DOSHA EXPLANATION
  document.getElementById("dosha-cards").innerHTML = `
  <div class="dosha-grid">

    <div class="dosha-card vata">
      <h3>Vata</h3>
      <p>Represents movement, creativity, and variability. When balanced, it gives energy and flexibility. When imbalanced, it causes anxiety and irregularity.</p>
    </div>

    <div class="dosha-card pitta">
      <h3>Pitta</h3>
      <p>Represents metabolism and transformation. Balanced pitta gives focus and intelligence, but excess leads to anger and acidity.</p>
    </div>

    <div class="dosha-card kapha">
      <h3>Kapha</h3>
      <p>Represents structure and stability. Balanced kapha provides strength, but excess leads to sluggishness and weight gain.</p>
    </div>

  </div>
  `;

  // USER ANALYSIS
  document.getElementById("analysis").innerHTML = `

  <div class="analysis-card">
    <h3>Your Result</h3>
    <p>Your dominant dosha is <b>${dom}</b>. This defines your natural tendencies in body and mind.</p>
  </div>

  <div class="analysis-card">
    <h3>What This Means</h3>
    <p>
    ${dom === "Vata" ? "You are creative and energetic but may experience instability, anxiety, or irregular habits." :
      dom === "Pitta" ? "You are driven and focused but may face stress, irritation, or digestive heat." :
        "You are calm and stable but may struggle with low energy and slow metabolism."
    }
    </p>
  </div>

  <div class="analysis-card">
    <h3>Recommendations</h3>
    <p>
    ${dom === "Vata" ? "Maintain routine, eat warm food, and ensure proper rest." :
      dom === "Pitta" ? "Avoid overheating, manage stress, and eat cooling foods." :
        "Stay active, eat light meals, and avoid oversleeping."
    }
    </p>
  </div>

  `;

  document.getElementById("result").classList.remove("hidden");
}