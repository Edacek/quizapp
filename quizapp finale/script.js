// =====================
// 1) Výběr prvků z DOM
// =====================

// Části kvízu / obrazovky
const startScreen = document.querySelector(".startscreen"); // startovní obrazovka
const quizScreen = document.querySelector(".quiz"); // obrazovka kvízu
const endScreen = document.querySelector(".end-screen"); // konečná obrazovka

// Tlačítka
const startButton = document.querySelector(".start"); // spuštění kvízu
const submitButton = document.querySelector(".submit"); // potvrdit oznacenou odpoved
const nextButton = document.querySelector(".next"); // dalsi otazka
const restartButton = document.querySelector(".restart"); // restart kvízu

// Text otázky + odpovědi
const questionText = document.querySelector(".question"); // otázka
const answerBoxes = document.querySelectorAll(".answer"); // jednotlive odpovědi
const answerTexts = document.querySelectorAll(".answer .text"); // texty odpovědí

// Počítadlo otázek
const currentSpan = document.querySelector(".current"); // pořadí otázky
const totalSpan = document.querySelector(".total"); // počet otázek v průběhu kvízu

// Skóre na konci
const finalScoreEl = document.querySelector(".final-score"); // správné odpovědi
const totalScoreEl = document.querySelector(".total-score"); // počet otázek na konci kvízu

// Nastavení na startovní obrazovce
const numQuestionsSelect = document.querySelector("#num-questions"); // počet otázek
const categorySelect = document.querySelector("#category"); // kategorie
const difficultySelect = document.querySelector("#difficulty");  // obtížnost

// Časovač 
const timeSelect = document.querySelector("#time");  // výběr času 
const progressBar = document.querySelector(".progress-bar"); // progress pruh 
const progressText = document.querySelector(".progress-text");  // text uprostřed 


// odznaky
const badgeCategoryEl = document.querySelector(".badge-category"); // odznak kategorie
const badgeDifficultyEl = document.querySelector(".badge-difficulty"); // odznak obtížnosti









// =====================
// 2) Data (questions.json)
// =====================
let questions = []; // pole, do kterého se uloží otázky načtené z questions.json









// =====================
// 3) Stav aplikace (state)
// =====================
let selectedQuestions = []; // vybrané otázky pro aktuální kvíz
let currentQuestionIndex = 0; // aktuální pořadí otázky
let score = 0; // počet správných odpovědí
let selectedAnswerIndex = null;  // index vybrané odpovědi -----------?

// Stav časovače
let timePerQuestion = 15;   // výchozí hodnota (přepíše se podle selectu)
let timeLeft = 15; // zbývající čas
let timerInterval = null; // reference na běžící interval časovače -----------?









// =====================
// 4) Pomocné funkce (utils)
// =====================

async function loadQuestions() { // Načtení databáze otázek ze souboru questions.json

  const response = await fetch("questions.json");  // načtení JSON souboru s otázkami


  if (!response.ok) {
    throw new Error("Nepodařilo se načíst questions.json (HTTP " + response.status + ")");   // kontrola, zda se soubor podařilo načíst

  }

  const data = await response.json();   // převod JSON dat na JavaScript objekt


  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("questions.json neobsahuje platné pole otázek.");   // kontrola, zda soubor obsahuje pole otázek --------?

  }

  // odstranění pomocných _comment položek z JSON souboru
  questions = data.filter((q) => !q._comment);

  // Základní kontrola struktury otázky
  const bad = questions.find(
    (q) =>
      typeof q.question !== "string" ||
      !Array.isArray(q.answers) ||
      typeof q.correct !== "number"
  );

  if (bad) {
    throw new Error("V questions.json je otázka se špatnou strukturou."); // pokud některá otázka nemá správnou strukturu, vyhodí se chyba
  }
}

// Funkce pro náhodné promíchání pole (Fisher-Yates shuffle)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// funkce pro filtr kategorie
function filterByCategory(allQuestions, selectedCategory) { 
  // "Vsechno" = bez filtru
  if (selectedCategory === "Vsechno") return allQuestions;
  return allQuestions.filter((q) => q.category === selectedCategory);
}

// funkce pro filtr obtížnosti
function filterByDifficulty(allQuestions, selectedDifficulty) {
  // "Any-difficulty" = bez filtru
  if (selectedDifficulty === "Any-difficulty") return allQuestions;
  return allQuestions.filter((q) => q.difficulty === selectedDifficulty);
}

 // funkce pro odznaky obtížnosti
function difficultyToCz(diff) {
  const map = {
    easy: "Lehký",
    medium: "Střední",
    hard: "Těžký",
    extreme: "Extrémní"
  };
  return map[diff] ?? diff;
}

function setDifficultyBadgeClass(el, diff) {
  el.classList.remove("badge--easy", "badge--medium", "badge--hard", "badge--extreme");
  el.classList.add(`badge--${diff}`);
}

// funkce pro odznaky podle kategorie
function setCategoryBadge(category) {

  // Nejprve odstraníme všechny existující třídy kategorií
  badgeCategoryEl.classList.remove(
    "badge--sport",
    "badge--historie",
    "badge--geografie",
    "badge--kultura"
  );

  // Podle názvu kategorie přidáme odpovídající CSS třídu
  if (category === "Sport") {
    badgeCategoryEl.classList.add("badge--sport");

  } else if (category === "Historie") {
    badgeCategoryEl.classList.add("badge--historie");

  } else if (category === "Geografie") {
    badgeCategoryEl.classList.add("badge--geografie");

  } else if (category === "Kultura") {
    badgeCategoryEl.classList.add("badge--kultura");
  }
}







// =====================
// 5) Časovač (timer)
// =====================

// Zastaví běžící časovač
function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval); // zrušení intervalového časovače -------?
    timerInterval = null; // vynulování proměnné, aby bylo jasné, že časovač neběží

  }
}


// Aktualizace vizuálního zobrazení časovače podle zvoleného času
function updateTimerUI() {
  // Text uprostřed progress baru = počet sekund do konce
  progressText.textContent = String(timeLeft);

  // Výpočet šířky progress baru v procentech
  const percent = (timeLeft / timePerQuestion) * 100;

  // Nastavení šířky progress baru
  progressBar.style.width = `${percent}%`;
}


// Funkce, která se spustí při vypršení času
function handleTimeOut() {

   // zastavení časovače
  stopTimer();

  // index správné odpovědi -----?
  const correctIndex = selectedQuestions[currentQuestionIndex].correct;

  // zamknutí odpovědí (uživatel už nemůže kliknout)
  answerBoxes.forEach((box) => (box.style.pointerEvents = "none"));

  // Obarvit správnou + případně vybranou špatnou (pokud uživatel něco zvolil)
  answerBoxes.forEach((box, index) => {
    if (index === correctIndex) box.classList.add("correct");
    else if (index === selectedAnswerIndex) box.classList.add("wrong");
  });

  // Přepnout tlačítka z potvrdit na další otázka
  submitButton.disabled = true;
  submitButton.style.display = "none";
  nextButton.style.display = "block";
}


// Spuštění časovače pro aktuální otázku
function startTimer() {
  stopTimer(); // nejprve zastavit případný starý časovač
  timeLeft = timePerQuestion; // nastavení počátečního času
  updateTimerUI();  // aktualizace UI


  timerInterval = setInterval(() => {   // spuštění intervalového časovače (1 sekunda)

    timeLeft--;  // odečtení jedné sekundy
    updateTimerUI();  

    if (timeLeft <= 0) {   // pokud čas vypršel
      handleTimeOut();
    }
  }, 1000);
}

// Funkce jsou seřazeny shora dolů pro lepší čitelnost.
// Funkce startTimer() využívá všechny předchozí funkce.
// V JavaScriptu na pořadí funkcí nezáleží, ale toto uspořádání je přehlednější.










// =====================
// 6) UI / Průběh kvízu
// =====================

// Spuštění kvízu
async function startQuiz() {

  try {

    // Načtení databáze otázek ze souboru questions.json
    // Funkce loadQuestions() provede HTTP požadavek a uloží otázky do pole "questions"
    await loadQuestions();


    // Reset stavu aplikace při startu nového kvízu
    currentQuestionIndex = 0;   // začínáme od první otázky
    score = 0;                  // vynulování skóre
    selectedAnswerIndex = null; // zatím není vybraná žádná odpověď


    // Načtení nastavení, které uživatel zvolil na startovní obrazovce
    // Hodnoty jsou načteny z HTML <select> prvků
    const requestedCount = Number(numQuestionsSelect.value); // počet otázek v kvízu
    const selectedCategory = categorySelect.value;           // vybraná kategorie
    const selectedDifficulty = difficultySelect.value;       // vybraná obtížnost


    // Nastavení času na otázku podle výběru uživatele
    // Hodnota je převedena na číslo pomocí Number()
    timePerQuestion = Number(timeSelect.value);
    timeLeft = timePerQuestion; // počáteční hodnota časovače


    // Filtrace otázek podle zvolených parametrů
    // Nejprve se filtruje kategorie, poté obtížnost
    let filtered = filterByCategory(questions, selectedCategory);
    filtered = filterByDifficulty(filtered, selectedDifficulty);


    // Pokud po filtraci nezbyly žádné otázky, zobrazí se upozornění
    if (filtered.length === 0) {
      alert("Pro vybranou kombinaci kategorie a obtížnosti nejsou v databázi žádné otázky.");
      return; // ukončení funkce
    }


    // Náhodné promíchání otázek
    // Používá se Fisher-Yates algoritmus (funkce shuffleArray)
    const shuffled = shuffleArray(filtered);


    // Kontrola, zda je v databázi dostatek otázek
    if (requestedCount > shuffled.length) {

      // Text pro kategorii v upozornění
      const catText =
        selectedCategory === "Vsechno"
          ? "všech kategoriích"
          : `kategorii "${selectedCategory}"`;

      // Text pro obtížnost v upozornění
      const diffText =
        selectedDifficulty === "Any-difficulty"
          ? "všech obtížnostech"
          : `obtížnosti "${selectedDifficulty}"`;

      // Upozornění uživatele, že otázek je méně než požadoval
      alert(`V ${catText} a ${diffText} je jen ${shuffled.length} otázek. Spustím kvíz s dostupným počtem.`);
    }


    // Výběr finálního seznamu otázek pro aktuální kvíz
    // Použije se menší z hodnot:
    // - požadovaný počet otázek
    // - počet dostupných otázek
    selectedQuestions = shuffled.slice(0, Math.min(requestedCount, shuffled.length));


    // Bezpečnostní kontrola (neměla by nastat, ale je dobrá praxe)
    if (selectedQuestions.length === 0) {
      alert("V databázi nejsou žádné otázky.");
      return;
    }


    // Přepnutí obrazovek aplikace
    // Skryje startovní a konečnou obrazovku
    // a zobrazí obrazovku kvízu
    startScreen.classList.add("hide");
    endScreen.classList.add("hide");
    quizScreen.classList.remove("hide");


    // Zobrazení první otázky kvízu
    showQuestion();


  } catch (err) {

    // Zachycení případné chyby při načítání dat nebo práci s JSON
    alert("Chyba: " + err.message);

    // Výpis chyby do konzole pro vývojáře
    console.error(err);
  }
}



// Zobrazení aktuální otázky v rozhraní kvízu
function showQuestion() {

    // Načtení aktuální otázky z pole vybraných otázek
  const q = selectedQuestions[currentQuestionIndex];

  // Nastavení odznaků pro kategorii a obtížnost otázky
  badgeCategoryEl.textContent = q.category ?? ""; // kategorie
  setCategoryBadge(q.category);
  badgeDifficultyEl.textContent = difficultyToCz(q.difficulty ?? ""); // obtiznost
  setDifficultyBadgeClass(badgeDifficultyEl, q.difficulty);


  // Text otázky
  questionText.textContent = q.question;

  // Číslování
  currentSpan.textContent = (currentQuestionIndex + 1);
  totalSpan.textContent = "/" + (selectedQuestions.length);

  // Vložení textů odpovědí do jednotlivých HTML prvků
  answerTexts.forEach((el, i) => {
    el.textContent = q.answers[i] ?? "";
  });

  // Reset stavu otázky
  selectedAnswerIndex = null; // zatím není vybraná žádná odpověď
  submitButton.disabled = true; // tlačítko potvrdit je deaktivované
  submitButton.style.display = "block"; // zobrazit tlačítko potvrdit
  nextButton.style.display = "none"; // skrýt tlačítko další otázka

  // Vyčistit barvy rámečků z předchozí otázky + povolit klikání
  answerBoxes.forEach((box) => {
    box.classList.remove("selected", "correct", "wrong");
    box.style.pointerEvents = "auto";
  });

  // Spuštění časovače pro aktuální otázku
  startTimer();
}




// Ukončení kvízu a zobrazení výsledků
function finishQuiz() {

  // Zastavení časovače (aby už neběžel interval)
  stopTimer();

  // Přepnutí obrazovek aplikace
  // Skryje obrazovku kvízu a zobrazí obrazovku s výsledkem
  quizScreen.classList.add("hide");
  endScreen.classList.remove("hide");

  // Zobrazení výsledného skóre
  finalScoreEl.textContent = score; // počet správných odpovědí
  totalScoreEl.textContent = "/" + selectedQuestions.length; // celkový počet otázek
}









// =====================
// 7) Event listenery / Reakce na události
// =====================
// Event listener je funkce, která čeká na určitou událost (event) př. kliknuti na tlacitko a když nastane, spustí definovaný kód.


// Spuštění kvízu po kliknutí na tlačítko "Začít kvíz"
// Při kliknutí se zavolá funkce startQuiz(), která připraví a spustí kvíz
startButton.addEventListener("click", startQuiz);


// Výběr odpovědi uživatelem
// Každé odpovědi (boxu) přidáme posluchač události "click"
answerBoxes.forEach((box, index) => {

  box.addEventListener("click", () => {

    // Nejprve odstraníme označení vybrané odpovědi ze všech boxů
    answerBoxes.forEach((b) => b.classList.remove("selected"));

    // Označíme aktuálně kliknutou odpověď
    box.classList.add("selected");

    // Uložíme index vybrané odpovědi
    selectedAnswerIndex = index;

    // Aktivujeme tlačítko "Potvrdit odpověď"
    submitButton.disabled = false;
  });
});


// Potvrzení odpovědi
// Po kliknutí na tlačítko "Potvrdit" se vyhodnotí odpověď uživatele
submitButton.addEventListener("click", () => {

  // Zastavení časovače (aby se už dále neodečítal čas)
  stopTimer();

  // Získání indexu správné odpovědi u aktuální otázky
  const correctIndex = selectedQuestions[currentQuestionIndex].correct;


  // Zamknutí odpovědí – uživatel už nemůže kliknout na jinou odpověď
  answerBoxes.forEach((box) => (box.style.pointerEvents = "none"));


  // Zvýraznění odpovědí
  answerBoxes.forEach((box, index) => {

      // Správná odpověď se označí zeleně
    if (index === correctIndex) {
      box.classList.add("correct");
    }

      // Vybraná špatná odpověď se označí červeně
    else if (index === selectedAnswerIndex) {
      box.classList.add("wrong");
    }

  });


  // Vyhodnocení odpovědi
  // Pokud uživatel vybral správnou odpověď, zvýší se skóre
  if (selectedAnswerIndex === correctIndex) {
    score++;
  }


  // Přepnutí ovládacích tlačítek
  submitButton.style.display = "none";
  // Tlačítko "Potvrdit" se skryje a zobrazí se tlačítko "Další otázka"
  nextButton.style.display = "block";

});




// Přechod na další otázku
nextButton.addEventListener("click", () => {

  // Zastavení časovače pro jistotu (aby neběžel starý interval)
  stopTimer();

  // Posun indexu na další otázku
  currentQuestionIndex++;


  // Pokud ještě existují další otázky, zobrazí se další
  if (currentQuestionIndex < selectedQuestions.length) {

    showQuestion();

  } 
  
  // Pokud už žádné otázky nezbývají, kvíz se ukončí
  else {

    finishQuiz();

  }
});



// Restart kvízu po kliknutí na tlačítko "Restartovat"
restartButton.addEventListener("click", () => {

  // Zastavení případného běžícího časovače
  stopTimer();


  // Přepnutí obrazovek aplikace
  // Skryje obrazovku výsledků i kvízu a zobrazí startovní obrazovku
  endScreen.classList.add("hide");
  quizScreen.classList.add("hide");
  startScreen.classList.remove("hide");


  // Reset proměnných stavu aplikace
  currentQuestionIndex = 0;   // index aktuální otázky
  score = 0;                  // skóre uživatele
  selectedQuestions = [];     // pole vybraných otázek
  selectedAnswerIndex = null; // žádná odpověď není vybraná


  // Reset ovládacích tlačítek
  submitButton.disabled = true;     // tlačítko potvrdit je deaktivované
  submitButton.style.display = "block";
  nextButton.style.display = "none";


  // Vyčištění vizuálního stavu odpovědí
  // odstranění označení odpovědí z předchozího kvízu
  answerBoxes.forEach((box) => {
    box.classList.remove("selected", "correct", "wrong");
    box.style.pointerEvents = "auto"; // znovu povolit klikání
  });


  // Reset zobrazení časovače
  // nastaví čas podle aktuální hodnoty ve výběru času
  timeLeft = Number(timeSelect.value);
  timePerQuestion = timeLeft;

  // Aktualizace progress baru
  updateTimerUI();
});

