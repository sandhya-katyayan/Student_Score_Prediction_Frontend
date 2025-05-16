const form = document.getElementById('inputForm');
const inputArea = document.getElementById('inputArea');
const questionLabel = document.getElementById('questionLabel');
const stepNum = document.getElementById('stepNum');
const prevBtn = document.getElementById('prevBtn');

const resultContainer = document.getElementById('resultContainer');
const cgpaDisplay = document.getElementById('cgpaDisplay');
const emojiDisplay = document.getElementById('emojiDisplay');
const homeBtn = document.getElementById('homeBtn');

let currentStep = 0;
let formData = {};

const questions = [
  { label: "Enter your Previous Semester CGPA:", type: "number", name: "Sem1" },
  { label: "How many average hours do you study per day?", type: "number", name: "Study_Hr" },
  { label: "How many hours do you sleep per day?", type: "number", name: "Sleep_Hr" },
  { label: "Do you have any active backlogs?", type: "select", name: "Active_backlog", options: ["Yes", "No"] },
  { label: "Time spent on extra curriculum daily during semester Exam(in hours)?", type: "number", name: "ExtraCurriculum" },
  { label: "Daily screen time on Social Media(in hours)?", type: "number", name: "Screen_time" },
  { label: "Rate your Health:", type: "select", name: "Health", options: ["Low", "Medium", "High"] },
  { label: "Stress level:", type: "select", name: "stress_level", options: ["Low", "Medium", "High"] },
  { label: "Motivation level:", type: "select", name: "Motivation", options: ["Low", "Medium", "High"] },
];

function loadQuestion() {
  const current = questions[currentStep];
  questionLabel.textContent = current.label;
  stepNum.textContent = currentStep + 1;

  if (current.type === "number") {
    inputArea.innerHTML = `<input type="number" id="inputField" min="0" step="0.01" required />`;
    setTimeout(() => {
      document.getElementById("inputField").focus();
    }, 0);
  } else if (current.type === "select") {
    let emojiMap = {};
    if (current.name === "Active_backlog") {
      emojiMap = { "Yes": "✅", "No": "❌" };
    } else if (current.name === "Health") {
      emojiMap = { "Low": "😷", "Medium": "🙂", "High": "💪" };
    } else if (current.name === "Motivation") {
      emojiMap = { "Low": "😞", "Medium": "🔥", "High": "🏆" };
    } else if (current.name === "stress_level") {
      emojiMap = { "Low": "😄", "Medium": "😐", "High": "😰" };
    }

    inputArea.innerHTML = current.options.map(opt => `
      <button type="button" class="emoji-option" data-value="${opt}" style="margin: 0.5rem;">
        ${emojiMap[opt] || opt}
      </button>
    `).join('');

    document.querySelectorAll('.emoji-option').forEach(btn => {
      btn.addEventListener('click', () => {
        formData[current.name] = btn.getAttribute('data-value');
        if (currentStep < questions.length - 1) {
          currentStep++;
          loadQuestion();
        } else {
          form.dispatchEvent(new Event('submit'));
        }
      });
    });
  }

  prevBtn.classList.toggle('hidden', currentStep === 0);
  homeBtn.classList.add('hidden');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const input = document.getElementById('inputField');
  if (questions[currentStep].type === "number") {
    formData[questions[currentStep].name] = input.value;
  }

  if (currentStep < questions.length - 1) {
    currentStep++;
    loadQuestion();
  } else {
    form.classList.add('hidden');
    prevBtn.classList.add('hidden');
    emojiDisplay.innerHTML = `<div class="loading-emoji"><span class="rotate">⌛</span></div>`;
    cgpaDisplay.textContent = " Predicting your CGPA...";
    resultContainer.classList.remove('hidden');

    setTimeout(() => {
      fetch('https://student-cgpa-predictor-backend-1.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(data => {
          if (data.prediction !== undefined) {
            const prediction = parseFloat(data.prediction);
            let emoji = "😔", message = "Don't worry, stay consistent and improve!";

            if (prediction > 8) {
              emoji = "😁";
              message = "Amazing! You're doing great!";
            } else if (prediction >= 7) {
              emoji = "🙂";
              message = "Good! Keep pushing a bit more.";
            }

            emojiDisplay.innerHTML = `<div style="font-size: 5rem;">${emoji}</div>`;
            cgpaDisplay.textContent = `Your predicted CGPA: ${prediction.toFixed(2)} — ${message}`;
            homeBtn.classList.remove('hidden');

            // ✅ Show Suggestions Logic
            const suggestionBox = document.getElementById('suggestionBox');
            const toggleBtn = document.getElementById('toggleSuggestionBtn');
            suggestionBox.innerHTML = generateSuggestions(prediction, formData);
            suggestionBox.style.display = "none"; 
            toggleBtn.textContent = "Show Suggestions";
            cgpaDisplay.style.display = "block";

            toggleBtn.onclick = () => {
              const isHidden = suggestionBox.style.display === "none";
              suggestionBox.style.display = isHidden ? "block" : "none";
              cgpaDisplay.style.display = isHidden ? "none" : "block";
              toggleBtn.textContent = isHidden ? "Hide Suggestions" : "Show Suggestions";
            };
          } else {
            cgpaDisplay.textContent = "⚠️ Something went wrong with prediction!";
          }
        })
        .catch(err => {
          cgpaDisplay.textContent = "⚠️ Something went wrong!";
          console.error(err);
        });
    }, 1000);
  }
});

prevBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    loadQuestion();
  }
});

homeBtn.addEventListener('click', () => {
  currentStep = 0;
  formData = {};
  loadQuestion();
  form.classList.remove('hidden');
  resultContainer.classList.add('hidden');

  // ✅ Reset Suggestion Box
  const suggestionBox = document.getElementById('suggestionBox');
  const toggleBtn = document.getElementById('toggleSuggestionBtn');
  suggestionBox.style.display = "none";
  toggleBtn.textContent = "Show Suggestions";
  cgpaDisplay.style.display = "block";
});

// ✅ Suggestion Generator
function generateSuggestions(pred, data) {
  let suggestions = [];

  const study = parseFloat(data.Study_Hr);
  const sleep = parseFloat(data.Sleep_Hr);
  const screen = parseFloat(data.Screen_time);
  const health = data.Health;
  const stress = data.stress_level;
  const motivation = data.Motivation;
  const backlog = data.Active_backlog;
  const extra = parseFloat(data.ExtraCurriculum);

  if (pred > 8) {
    suggestions.push("🎉 Excellent performance! Just maintain your habits.");
    if (study >= 3) suggestions.push("📘 Great study schedule. Keep it consistent.");
    if (health === "High") suggestions.push("💪 Your health is in great shape. Well done!");
    if (screen > 4) suggestions.push("📵 Try reducing screen time to below 4 hours.");
    if (extra > 3) suggestions.push("🎯 Reduce extra activities and focus more on academics.");
    if (motivation === "Medium") suggestions.push("🚀 Work on your motivation. Set small daily goals.");
    if (stress === "High") suggestions.push("🧘 Try stress-reducing activities like meditation or light exercise.");
  } 
  else if (pred >= 7) {
    if (study < 2.5) suggestions.push("📚 Try to increase study time to at least 2.5–3 hours daily.");
    if (sleep < 6) suggestions.push("🛌 Increase your sleep to 6–8 hours for better focus.");
    if (screen > 4) suggestions.push("📵 Try reducing screen time to below 4 hours.");
    if (extra > 3) suggestions.push("🎯 Reduce extra activities and focus more on academics.");
    if (motivation === "Low") suggestions.push("🚀 Work on your motivation. Set small daily goals.");
    if (stress === "High") suggestions.push("🧘 Try stress-reducing activities like meditation or light exercise.");
  } 
  else {
    suggestions.push("⚠️ You need improvement in several areas. Here's what you can do:");

    if (study < 2) suggestions.push("📖 Study time is too low. Aim for at least 2.5+ hours daily.");
    if (sleep < 6) suggestions.push("😴 Poor sleep affects concentration. Try sleeping 6–8 hours.");
    if (screen > 4) suggestions.push("📵 High screen time is distracting. Cut it down to 2–3 hours.");
    if (extra > 3) suggestions.push("🏃 Limit time on non-academic activities. Balance is key.");
    if (backlog === "Yes") suggestions.push("🚫 Clear active backlogs as they impact performance.");
    if (health === "Low") suggestions.push("🥗 Improve your health with better diet and routine.");
    if (motivation === "Low") suggestions.push("🔥 Low motivation detected. Start with small wins daily.");
    if (stress === "High") suggestions.push("😟 High stress level. Take breaks, talk to mentors/friends.");
  }

  return suggestions.map(s => `<div>${s}</div>`).join('');
}

loadQuestion();