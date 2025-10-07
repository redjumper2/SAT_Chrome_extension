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
  
  // Update question number and navigation
  document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
  document.getElementById('questionNav').textContent = 
    `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  
  // Reset mark for review
  document.getElementById('markReview').checked = false;
  
  // Split question text into passage and question
  const questionParts = question.questionText.split('\n\n');
  const passageText = questionParts.length > 1 ? questionParts.slice(0, -1).join('\n\n') : '';
  const actualQuestion = questionParts[questionParts.length - 1];
  
  // Display passage (if exists) and question
  document.getElementById('passageText').textContent = passageText || 'No passage for this question.';
  document.getElementById('questionText').textContent = actualQuestion;
  
  // Display choices
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';
  
  question.choices.forEach((choice) => {
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice';
    choiceDiv.innerHTML = `
      <div class="choice-letter">${choice.id}</div>
      <div class="choice-text">${choice.text}</div>
      <div class="choice-indicator"></div>
    `;
    
    choiceDiv.addEventListener('click', () => selectAnswer(choice.id, choiceDiv, question));
    choicesContainer.appendChild(choiceDiv);
  });
  
  // Hide feedback and enable next button
  document.getElementById('feedback').innerHTML = '';
  document.getElementById('nextBtn').disabled = true;
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
  
  // Enable next button
  document.getElementById('nextBtn').disabled = false;
}

// Next button handler
document.getElementById('nextBtn').addEventListener('click', () => {
  if (selectedAnswer === null) return;
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
  
  document.querySelector('.header').style.display = 'none';
  
  document.querySelector('.container').innerHTML = `
    <div class="results">
      <h2>Quiz Complete!</h2>
      <div class="score">${score} / ${questions.length}</div>
      <p style="font-size: 28px; font-weight: 600; color: #4a7ba7; margin: 20px 0;">${percentage}%</p>
      <p style="font-size: 18px; color: #6b7280;">Time: ${timeStr}</p>
      <button class="restart-btn" onclick="restartQuiz()">Restart Quiz</button>
    </div>
  `;
}

function restartQuiz() {
  document.querySelector('.header').style.display = 'flex';
  startQuiz();
}

function showNoQuestionsMessage() {
  clearInterval(timerInterval);
  document.querySelector('.header').style.display = 'none';
  
  document.querySelector('.container').innerHTML = `
    <div class="results">
      <h2>No Questions Available</h2>
      <p style="font-size: 18px; color: #6b7280; margin: 30px 0;">
        Please add questions from the SAT Question Bank first.
      </p>
      <button class="restart-btn" onclick="window.close()">Close</button>
    </div>
  `;
}