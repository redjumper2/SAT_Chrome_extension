let questions = [];
let currentQuestion = 0;
let timerInterval;
const timePerQuestion = 30; // seconds

// Load questions from local JSON file
fetch(chrome.runtime.getURL('questions.json'))
  .then(response => response.json())
  .then(data => {
    questions = data;
    showQuestion(currentQuestion);
  })
  .catch(err => console.error("Failed to load questions:", err));

function showQuestion(index) {
    if(index >= questions.length) {
        document.getElementById("quiz-container").innerHTML = "<h3>Quiz Complete!</h3>";
        return;
    }

    const q = questions[index];
    document.getElementById("question").innerText = q.text;
    const answersUl = document.getElementById("answers");
    answersUl.innerHTML = "";

    q.answers.forEach(ans => {
        const li = document.createElement("li");
        li.innerText = ans;
        li.addEventListener("click", () => checkAnswer(ans, q.correct));
        answersUl.appendChild(li);
    });

    startTimer(timePerQuestion);
}

function checkAnswer(selected, correct) {
    clearInterval(timerInterval);
    const feedback = document.getElementById("feedback");
    if(selected === correct) feedback.innerText = "Correct!";
    else feedback.innerText = `Wrong! Correct: ${correct}`;

    currentQuestion++;
    setTimeout(() => {
        feedback.innerText = "";
        showQuestion(currentQuestion);
    }, 2000);
}

function startTimer(seconds) {
    const timerEl = document.getElementById("timer");
    timerEl.innerText = `Time: ${seconds}`;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        seconds--;
        timerEl.innerText = `Time: ${seconds}`;
        if(seconds <= 0) {
            clearInterval(timerInterval);
            checkAnswer(null, questions[currentQuestion].correct);
        }
    }, 1000);
}
