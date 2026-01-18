 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index 6b8d197003f98cbff42e919bf93c8218b8c3239a..93abf84ac057457f1d43ed019a3fb479d590149a 100644
--- a/script.js
+++ b/script.js
@@ -1,48 +1,50 @@
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
+const categorySelect = document.querySelector("#category");
+const difficultySelect = document.querySelector("#difficulty");
 
 
 
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
 
@@ -105,58 +107,77 @@ async function loadQuestions() {
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
+      const selectedCategory = categorySelect.value;
+      const selectedDifficulty = difficultySelect.value;
+
+      const filteredQuestions = questions.filter((question) => {
+        const matchesCategory =
+          selectedCategory === "Vsechno" || question.category === selectedCategory;
+        const matchesDifficulty =
+          selectedDifficulty === "Any-difficulty" ||
+          question.difficulty === selectedDifficulty;
+
+        return matchesCategory && matchesDifficulty;
+      });
+
+      if (filteredQuestions.length === 0) {
+        alert("Pro zvolené filtry nejsou žádné otázky.");
+        return;
+      }
 
-// základ: vezmeme všechny otázky, promícháme a vybereme jen požadovaný počet
-const shuffled = shuffleArray(questions);
-selectedQuestions = shuffled.slice(0, requestedCount);
-if (selectedQuestions.length === 0) {
-    alert("V databázi nejsou žádné otázky.");
-    return;
-  }
+      const shuffled = shuffleArray(filteredQuestions);
+      const finalCount = Math.min(requestedCount, shuffled.length);
+      selectedQuestions = shuffled.slice(0, finalCount);
+
+      if (finalCount < requestedCount) {
+        alert(
+          `Pro zvolené filtry je dostupných pouze ${finalCount} otázek.`
+        );
+      }
   
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
@@ -190,26 +211,25 @@ nextButton.addEventListener("click", () => {
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
   
-
 
EOF
)
