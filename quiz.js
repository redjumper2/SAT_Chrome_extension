let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let startTime = Date.now();
let timerInterval = null;

// Load questions from storage
chrome.storage.local.get(['questions'], (result) => {
  questions = result.questions || [];
  
  if (questions.length === 0) {
    showNoQuestionsMessage();
    return;
  }
  
  startQuiz();
});

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  startTime = Date.now();
  startTimer();
  loadQuestion();
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

function loadQuestion() {
  if (currentQuestionIndex >= questions.length) {
    showResults();
    return;
  }

  const question = questions[currentQuestionIndex];
  selectedAnswer = null;
  
  // Update progress
  document.getElementById('progress').textContent = 
    `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  
  // Display question
  document.getElementById('questionText').textContent = question.questionText;
  
  // Display choices
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';
  
  question.choices.forEach((choice) => {
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice';
    choiceDiv.innerHTML = `
      <div class="choice-letter">${choice.id}</div>
      <div class="choice-text">${choice.text}</div>
    `;
    
    choiceDiv.addEventListener('click', () => selectAnswer(choice.id, choiceDiv, question));
    choicesContainer.appendChild(choiceDiv);
  });
  
  // Hide feedback and next button
  document.getElementById('feedback').innerHTML = '';
  document.getElementById('nextBtn').style.display = 'none';
}

function selectAnswer(answerId, choiceElement, question) {
  if (selectedAnswer !== null) return; // Already answered
  
  selectedAnswer = answerId;
  const isCorrect = answerId === question.correctAnswer;
  
  if (isCorrect) {
    score++;
  }
  
  // Disable all choices
  const allChoices = document.querySelectorAll('.choice');
  allChoices.forEach(choice => {
    choice.classList.add('disabled');
  });
  
  // Show correct/incorrect styling
  choiceElement.classList.add(isCorrect ? 'correct' : 'incorrect');
  
  // Highlight correct answer if user was wrong
  if (!isCorrect && question.correctAnswer) {
    allChoices.forEach((choice, index) => {
      if (question.choices[index].id === question.correctAnswer) {
        choice.classList.add('correct');
      }
    });
  }
  
  // Show feedback
  const feedback = document.getElementById('feedback');
  feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  feedback.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
  
  // Show next button
  document.getElementById('nextBtn').style.display = 'block';
}

// Next button handler
document.getElementById('nextBtn').addEventListener('click', () => {
  currentQuestionIndex++;
  loadQuestion();
});

function showResults() {
  clearInterval(timerInterval);
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  
  const percentage = Math.round((score / questions.length) * 100);
  
  document.getElementById('quizCard').innerHTML = `
    <div class="results">
      <h2>Quiz Complete!</h2>
      <div class="score">${score} / ${questions.length}</div>
      <p style="font-size: 24px; color: #6b7280; margin-bottom: 12px;">${percentage}% Correct</p>
      <p style="font-size: 18px; color: #9ca3af;">Time: ${timeStr}</p>
      <button class="restart-btn" onclick="restartQuiz()">Restart Quiz</button>
    </div>
  `;
}

function restartQuiz() {
  startQuiz();
}

function showNoQuestionsMessage() {
  clearInterval(timerInterval);
  document.getElementById('quizCard').innerHTML = `
    <div class="results">
      <h2>No Questions Available</h2>
      <p style="font-size: 18px; color: #6b7280; margin: 24px 0;">
        Please add questions from the SAT Question Bank first.
      </p>
      <button class="restart-btn" onclick="window.close()">Close</button>
    </div>
  `;
}