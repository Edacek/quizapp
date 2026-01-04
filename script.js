// =====================
// 1) Výběr prvků z DOM
// =====================
const startScreen = document.querySelector(".startscreen");
const quizScreen = document.querySelector(".quiz");
const endScreen = document.querySelector(".end-screen");

const startButton = document.querySelector(".start");
const submitButton = document.querySelector(".submit");
const nextButton = document.querySelector(".next");
const restartButton = document.querySelector(".restart");

const questionText = document.querySelector(".question");
const answerBoxes = document.querySelectorAll(".answer");
const answerTexts = document.querySelectorAll(".answer .text");

const currentSpan = document.querySelector(".current");
const totalSpan = document.querySelector(".total");

const finalScoreEl = document.querySelector(".final-score");
const totalScoreEl = document.querySelector(".total-score");

const numQuestionsSelect = document.querySelector("#num-questions");



// =====================
// 2) Data (json)
// =====================
let questions = [];

// =====================
// 3) Stav aplikace
// =====================
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswerIndex = null;
let selectedQuestions = [];


// =====================
// 4) Funkce
// =====================
function showQuestion() {
  const q = selectedQuestions[currentQuestionIndex];

  questionText.textContent = q.question;

  currentSpan.textContent = String(currentQuestionIndex + 1);
  totalSpan.textContent = "/" + String(selectedQuestions.length);

  // Naplnění odpovědí (počítáme se 3 odpověďmi, jak máš v HTML)
  answerTexts.forEach((el, i) => {
    el.textContent = q.answers[i] ?? "";
  });

  // Reset UI stavu
  selectedAnswerIndex = null;
  submitButton.disabled = true;
  submitButton.style.display = "block";
  nextButton.style.display = "none";

  answerBoxes.forEach((box) => {
    box.classList.remove("selected", "correct", "wrong");
    box.style.pointerEvents = "auto";
  });
}

function finishQuiz() {
  quizScreen.classList.add("hide");
  endScreen.classList.remove("hide");

  finalScoreEl.textContent = String(score);
  totalScoreEl.textContent = "/" + String(selectedQuestions.length);
}

async function loadQuestions() {
    const response = await fetch("questions.json");
  
    if (!response.ok) {
      throw new Error("Nepodařilo se načíst questions.json (HTTP " + response.status + ")");
    }
  
    const data = await response.json();
  
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("questions.json neobsahuje platné pole otázek.");
    }
  
    //  ODSTRANĚNÍ POZNÁMEK (_comment) – aby se nepočítaly jako otázky
    questions = data.filter((q) => !q._comment);
  
    // (volitelné, ale doporučené) základní kontrola struktury
    const bad = questions.find(
      (q) =>
        typeof q.question !== "string" ||
        !Array.isArray(q.answers) ||
        typeof q.correct !== "number"
    );
    if (bad) {
      throw new Error("V questions.json je otázka se špatnou strukturou.");
    }
  }
  
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  
async function startQuiz() {
    try {
      // načti otázky jen při prvním startu (rychlé a praktické)
      if (questions.length === 0) {
        await loadQuestions();
      }
  
      // reset
      currentQuestionIndex = 0;
      score = 0;
  
      startScreen.classList.add("hide");
      endScreen.classList.add("hide");
      quizScreen.classList.remove("hide");
  
      const requestedCount = Number(numQuestionsSelect.value);

// základ: vezmeme všechny otázky, promícháme a vybereme jen požadovaný počet
const shuffled = shuffleArray(questions);
selectedQuestions = shuffled.slice(0, requestedCount);
if (selectedQuestions.length === 0) {
    alert("V databázi nejsou žádné otázky.");
    return;
  }
  
      showQuestion();
    } catch (err) {
      alert("Chyba: " + err.message);
      console.error(err);
    }
}

// =====================
// 5) Event listenery
// =====================

// Start
startButton.addEventListener("click", startQuiz);

// Výběr odpovědi
answerBoxes.forEach((box, index) => {
  box.addEventListener("click", () => {
    answerBoxes.forEach((b) => b.classList.remove("selected"));
    box.classList.add("selected");

    selectedAnswerIndex = index;
    submitButton.disabled = false;
  });
});

// Potvrdit
submitButton.addEventListener("click", () => {
  const correctIndex = selectedQuestions[currentQuestionIndex].correct;

  // zamknout odpovědi
  answerBoxes.forEach((box) => (box.style.pointerEvents = "none"));

  // obarvit správnou + vybranou špatnou
  answerBoxes.forEach((box, index) => {
    if (index === correctIndex) box.classList.add("correct");
    else if (index === selectedAnswerIndex) box.classList.add("wrong");
  });

  // skóre
  if (selectedAnswerIndex === correctIndex) score++;

  submitButton.style.display = "none";
  nextButton.style.display = "block";
});

// Další otázka
nextButton.addEventListener("click", () => {
  currentQuestionIndex++;

  if (currentQuestionIndex < selectedQuestions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
});

// Restart (zpět na startovní obrazovku)
restartButton.addEventListener("click", () => {
    endScreen.classList.add("hide");
    quizScreen.classList.add("hide");
    startScreen.classList.remove("hide");
  
    currentQuestionIndex = 0;
    score = 0;
    selectedQuestions = [];
  
    submitButton.disabled = true;
    submitButton.style.display = "block";
    nextButton.style.display = "none";
  
    answerBoxes.forEach((box) => {
      box.classList.remove("selected", "correct", "wrong");
      box.style.pointerEvents = "auto";
    });
  });
  

