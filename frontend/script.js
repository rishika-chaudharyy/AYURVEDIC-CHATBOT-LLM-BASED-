let latestQuery = "";
let latestResponse = "";
let speechUtterance = null;
let latestWhatIfQuery = "";
let latestWhatIfResponse = "";



async function sendMessage() {
  const input = document.getElementById("user-input");
  const responseArea = document.getElementById("response-area");


  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  latestQuery = message;

  responseArea.innerHTML = `
    <div class="user-box"><strong>You:</strong><br>${message}</div>
    <div class="ai-box">Analyzing...</div>
  `;

  try {
    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    });

    const data = await response.json();

    let cleanResponse = data.response
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, "")
      .replace(/\n/g, "<br>");

    latestResponse = data.response;

    responseArea.innerHTML = `
      <div class="user-box"><strong>You:</strong><br>${message}</div>
      <div class="ai-box">
        <strong>VedaMind:</strong><br>
        ${cleanResponse}
      </div>
    `;

  } catch (error) {
    responseArea.innerHTML = `
      <div class="user-box"><strong>You:</strong><br>${message}</div>
      <div class="ai-box">Server connection error.</div>
    `;
  }
}

async function sendWhatIf() {
  const input = document.getElementById("whatif-input");
  const responseArea = document.getElementById("whatif-response");

  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  latestWhatIfQuery = message;

  responseArea.innerHTML = `
    <div class="user-box"><strong>You:</strong><br>${message}</div>
    <div class="ai-box">Simulating future scenario...</div>
  `;

  const response = await fetch("http://127.0.0.1:8000/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message })
  });

  const data = await response.json();

  let cleanResponse = data.response
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/\n/g, "<br>");

  latestWhatIfResponse = data.response;

  responseArea.innerHTML = `
    <div class="user-box"><strong>You:</strong><br>${message}</div>
    <div class="ai-box"><strong>VedaMind Simulation:</strong><br>${cleanResponse}</div>
  `;
}

const stages = [
  {
    text: "As the night sets in and your body begins to slow down, how do you usually respond to this natural transition period?",
    options: [
      { label: "I consciously go to bed before 10 PM to align with my body's rhythm", value: "sleep_early" },
      { label: "I stay awake late using my phone or working, often past midnight", value: "sleep_late" }
    ]
  },
  {
    text: "In the early morning hours, when the body is naturally light and clear, how do you typically begin your day?",
    options: [
      { label: "I wake up early feeling fresh and start my day calmly", value: "wake_early" },
      { label: "I wake up late feeling heavy, rushed, or unmotivated", value: "wake_late" }
    ]
  },
  {
    text: "Right after waking up, what is your first interaction with food or drink?",
    options: [
      { label: "I start with warm water or a soothing herbal drink", value: "warm_intake" },
      { label: "I either skip it or consume something cold like iced coffee", value: "cold_intake" }
    ]
  },
  {
    text: "When it comes to breakfast, how do you usually nourish your body?",
    options: [
      { label: "I eat a freshly prepared, warm meal that feels grounding", value: "healthy_breakfast" },
      { label: "I skip breakfast or rely on processed or quick options", value: "skip_breakfast" }
    ]
  },
  {
    text: "During moments of stress or workload pressure, how do you typically respond mentally and physically?",
    options: [
      { label: "I pause, breathe, and take short breaks to reset myself", value: "manage_stress" },
      { label: "I push through continuously without breaks", value: "ignore_stress" }
    ]
  },
  {
    text: "As the day winds down and your digestion slows, how do you approach your evening meal?",
    options: [
      { label: "I prefer a light, early dinner that feels easy to digest", value: "light_dinner" },
      { label: "I eat a heavy meal late at night, often close to sleep", value: "heavy_dinner" }
    ]
  },
  {
    text: "Before going to sleep, how do you prepare your mind and body for rest?",
    options: [
      { label: "I disconnect from screens and allow my mind to relax naturally", value: "calm_night" },
      { label: "I stay on my phone or laptop until I fall asleep", value: "screen_night" }
    ]
  }
];

let stageIndex = 0;
let userChoices = [];

function renderStage() {
  const stage = stages[stageIndex];
  const container = document.getElementById("story-stage");
  const progress = document.getElementById("progress-bar");

  progress.innerHTML = `Step ${stageIndex + 1} / ${stages.length}`;

  container.innerHTML = `
    <div class="story-card">
      <p>${stage.text}</p>
      ${stage.options.map(o =>
    `<button onclick="choose('${o.value}')">${o.label}</button>`
  ).join("")}
    </div>
  `;
}
let isCompleted = false;

function choose(value) {
  if (isCompleted) return;

  userChoices.push(value);
  stageIndex++;

  if (stageIndex < stages.length) {
    renderStage();
  } else {
    finishStory();
  }
}

function finishStory() {
  const result = document.getElementById("story-result");
  const container = document.getElementById("story-stage");

  isCompleted = true;
  container.innerHTML = "";

  let score = 0;
  let positives = [];
  let negatives = [];

  const scoring = {
    sleep_early: 2,
    sleep_late: -2,
    wake_early: 2,
    wake_late: -2,
    warm_intake: 2,
    cold_intake: -2,
    healthy_breakfast: 2,
    skip_breakfast: -2,
    manage_stress: 2,
    ignore_stress: -2,
    light_dinner: 2,
    heavy_dinner: -2,
    calm_night: 2,
    screen_night: -2
  };

  userChoices.forEach(choice => {
    score += scoring[choice];

    if (["sleep_early", "wake_early", "warm_intake", "healthy_breakfast", "manage_stress", "light_dinner", "calm_night"].includes(choice)) {
      positives.push(choice);
    } else {
      negatives.push(choice);
    }
  });

  // ===== DYNAMIC STORY BUILDING =====

  let intro = "";
  let bodyState = "";
  let imbalance = "";
  let recommendation = "";

  if (score >= 10) {
    intro = "Your day reflects a strong alignment with natural biological and Ayurvedic rhythms. Your choices indicate awareness and consistency in maintaining internal balance.";
  } else if (score >= 4) {
    intro = "Your routine shows a mix of conscious and unconscious habits. While some choices support balance, others may gradually create internal disruption.";
  } else {
    intro = "Your daily pattern suggests a disconnect from your body's natural rhythm. Several habits may be contributing to imbalance and reduced vitality.";
  }

  if (positives.includes("warm_intake") && positives.includes("light_dinner")) {
    bodyState = "Your digestive fire (Agni) appears stable, allowing your body to process food efficiently and maintain energy throughout the day.";
  } else {
    bodyState = "Your digestive fire (Agni) may be inconsistent, which can lead to incomplete digestion and toxin (Ama) accumulation over time.";
  }

  if (negatives.includes("ignore_stress") || negatives.includes("screen_night")) {
    imbalance += "Your nervous system is experiencing overstimulation, which may lead to restlessness, poor sleep quality, or mental fatigue. ";
  }

  if (negatives.includes("sleep_late")) {
    imbalance += "Late sleeping patterns are disrupting your body's repair cycle and hormonal balance. ";
  }

  if (negatives.includes("heavy_dinner") || negatives.includes("cold_intake")) {
    imbalance += "Your digestion is being challenged, increasing the likelihood of toxin buildup. ";
  }

  if (score >= 10) {
    recommendation = "Continue following this routine. Consistency in these habits will support long-term physical stability, mental clarity, and disease prevention.";
  } else if (score >= 4) {
    recommendation = "Focus on improving meal timing, sleep consistency, and stress handling. Small corrections will significantly improve your internal balance.";
  } else {
    recommendation = "Prioritize correcting sleep cycles, digestion habits, and stress management immediately. These are foundational to restoring balance.";
  }

  result.innerHTML = `
    <div class="story-output">

      <div class="score-box">
        <h2>${score} / 14</h2>
        <p>${score >= 10 ? "Balanced" : score >= 4 ? "Moderate" : "Imbalanced"}</p>
      </div>

      <h3>Your Lifestyle Reflection</h3>

      <p>${intro}</p>

      <h4>Internal State</h4>
      <p>${bodyState}</p>

      <h4>Observed Imbalances</h4>
      <p>${imbalance || "No major imbalances detected. Your routine supports stability."}</p>

      <h4>Recommendation</h4>
      <p>${recommendation}</p>

      <div class="action-buttons">
        <a href="dosha.html" class="profile-link">
          Go to Ayurvedic Profile
        </a>

        <button class="restart-btn" onclick="restartStory()">
          Retake Assessment
        </button>
      </div>

    </div>
  `;

  // POPUP AFTER RESULT
  setTimeout(() => {
    showPopup();
  }, 800);
}

function restartStory() {
  stageIndex = 0;
  userChoices = [];
  isCompleted = false;

  document.getElementById("story-result").innerHTML = "";
  renderStage();
}
function submitFeedback() {
  alert("Thank you for your feedback!");
  document.querySelector(".popup-overlay").remove();
}

renderStage();
function startListeningWhatIf() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("whatif-input").value = transcript;
  };
}
function speakWhatIfResponse() {
  if (!latestWhatIfResponse) return;

  const utterance = new SpeechSynthesisUtterance(latestWhatIfResponse);
  utterance.lang = "en-IN";
  utterance.rate = 1;

  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v =>
    v.lang === "en-IN" ||
    v.name.toLowerCase().includes("india")
  );

  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  window.speechSynthesis.speak(utterance);
}
async function downloadWhatIfPDF() {
  if (!latestWhatIfQuery || !latestWhatIfResponse) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("VedaMind AI - What-If Simulation Report", 20, 20);

  doc.setFontSize(12);
  doc.text("User Scenario:", 20, 35);
  doc.text(latestWhatIfQuery, 20, 45, { maxWidth: 170 });

  doc.text("Simulation Result:", 20, 70);
  doc.text(latestWhatIfResponse, 20, 80, { maxWidth: 170 });

  doc.save("VedaMind_WhatIf_Report.pdf");
}


// -------- SPEECH TO TEXT --------
function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
  };
}

// -------- TEXT TO SPEECH --------
function speakResponse() {
  if (!latestResponse) return;

  const utterance = new SpeechSynthesisUtterance(latestResponse);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-IN";   // Indian English

  const voices = window.speechSynthesis.getVoices();

  // Try to find Indian voice
  const indianVoice = voices.find(voice =>
    voice.lang === "en-IN" ||
    voice.name.toLowerCase().includes("india")
  );

  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  speechUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}


function stopSpeech() {
  window.speechSynthesis.cancel();
}

// -------- PDF DOWNLOAD --------
async function downloadPDF() {
  if (!latestQuery || !latestResponse) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("VedaMind AI Report", 20, 20);

  doc.setFontSize(12);
  doc.text("User Query:", 20, 35);
  doc.text(latestQuery, 20, 45, { maxWidth: 170 });

  doc.text("VedaMind Response:", 20, 70);
  doc.text(latestResponse, 20, 80, { maxWidth: 170 });

  doc.save("VedaMind_Report.pdf");
}
async function updateLifestyleDrift() {
  try {
    const response = await fetch("http://127.0.0.1:8000/lifestyle-drift");
    const data = await response.json();

    const driftBox = document.getElementById("drift-box");

    if (data.status === "stable") {
      driftBox.innerHTML = `
        <strong>Status:</strong> Stable ✅<br>
        ${data.message}
      `;
      driftBox.className = "drift-box stable";
    } else {
      let tips = data.suggestions.map(s => `• ${s}`).join("<br>");

      driftBox.innerHTML = `
        <strong>Status:</strong> Lifestyle Drift Detected ⚠️<br>
        ${data.message}<br><br>
        <strong>Suggested Corrections:</strong><br>
        ${tips}
      `;
      driftBox.className = "drift-box drift";
    }

  } catch (err) {
    console.error("Drift checker error", err);
  }
}


function quickPrompt(text) {
  document.getElementById("user-input").value = text;
  sendMessage();
}
function showPopup() {
  const existing = document.querySelector(".popup-overlay");
  if (existing) existing.remove();

  const popup = document.createElement("div");

  popup.className = "popup-overlay";

  popup.innerHTML = `
    <div class="popup-box">
      <h3>How was your experience?</h3>

      <div class="popup-buttons">
        <button class="popup-primary" onclick="submitFeedback('good')">Helpful</button>
        <button class="popup-secondary" onclick="submitFeedback('improve')">Needs Improvement</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
}

function submitFeedback(type) {
  alert("Thank you for your feedback!");
  closePopup();
}

function closePopup() {
  document.querySelector(".popup-overlay")?.remove();
}