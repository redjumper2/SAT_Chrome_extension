// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractQuestion") {
    try {
      const question = extractCurrentQuestion();
      sendResponse({ question: question, success: true });
    } catch (error) {
      console.error('Error extracting question:', error);
      sendResponse({ question: null, success: false, error: error.message });
    }
  }
  return true;
});

function extractCurrentQuestion() {
  const questionData = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    questionText: '',
    choices: [],
    correctAnswer: null
  };

  // Extract question from the modal if it's open
  const modal = document.querySelector('.cb-modal.cb-open');
  
  if (modal) {
    // Get the prompt/question text
    const promptDiv = modal.querySelector('.prompt');
    if (promptDiv) {
      questionData.questionText = promptDiv.innerText.trim();
    }
    
    // Get the question part (e.g., "Which choice completes the text...")
    const questionDiv = modal.querySelector('.question');
    if (questionDiv) {
      questionData.questionText += '\n\n' + questionDiv.innerText.trim();
    }

    // Get answer choices from the list
    const choicesList = modal.querySelector('.answer-choices ul');
    if (choicesList) {
      const choiceItems = choicesList.querySelectorAll('li');
      choiceItems.forEach((item, index) => {
        const text = item.innerText.trim();
        if (text) {
          questionData.choices.push({
            id: String.fromCharCode(65 + index), // A, B, C, D
            text: text
          });
        }
      });
    }

    // Try to detect the correct answer from the rationale if it's revealed
    const rationale = modal.querySelector('.rationale');
    if (rationale && rationale.style.display !== 'none') {
      const rationaleText = rationale.innerText;
      // Look for "Choice X is the best answer"
      const match = rationaleText.match(/Choice ([A-D]) is the best answer/i);
      if (match) {
        questionData.correctAnswer = match[1].toUpperCase();
      }
    }
  }

  // If no choices found or modal not open, return a helpful message
  if (questionData.choices.length === 0) {
    questionData.questionText = 'Please click on a question ID to open the question modal first';
    questionData.choices = [
      { id: 'A', text: 'Open a question first' },
      { id: 'B', text: 'Then add it to your quiz' }
    ];
  }

  // Default to 'A' if no correct answer detected
  if (!questionData.correctAnswer && questionData.choices.length > 0) {
    questionData.correctAnswer = 'A';
  }

  return questionData;
}

// Add buttons next to the Reveal Answer button
function addQuizButtons() {
  const modal = document.querySelector('.cb-modal.cb-open');
  if (!modal) return;

  // Find the reveal answer button
  const revealButton = modal.querySelector('#revealAnswerButton');
  if (!revealButton) return;

  // Check if buttons already exist
  if (modal.querySelector('#sat-add-question-btn')) return;

  // Create Add Question button
  const addButton = document.createElement('button');
  addButton.id = 'sat-add-question-btn';
  addButton.className = 'cb-btn square cb-btn-primary';
  addButton.style.marginLeft = '10px';
  addButton.textContent = 'Add to Quiz';
  
  // Create Copy button
  const copyButton = document.createElement('button');
  copyButton.id = 'sat-copy-question-btn';
  copyButton.className = 'cb-btn square cb-btn-primary';
  copyButton.style.marginLeft = '10px';
  copyButton.textContent = 'Copy Question';

  // Add buttons after the reveal button
  revealButton.parentNode.insertBefore(addButton, revealButton.nextSibling);
  revealButton.parentNode.insertBefore(copyButton, addButton.nextSibling);

  // Add event listeners
  addButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const question = extractCurrentQuestion();
    chrome.storage.local.get(['questions'], (result) => {
      const questions = result.questions || [];
      questions.push(question);
      chrome.storage.local.set({ questions: questions }, () => {
        showNotification('Question added to quiz!', 'success');
      });
    });
  });

  copyButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const question = extractCurrentQuestion();
    const formattedText = `
Question: ${question.questionText}

Choices:
${question.choices.map(c => `${c.id}. ${c.text}`).join('\n')}

Correct Answer: ${question.correctAnswer}
    `.trim();
    
    navigator.clipboard.writeText(formattedText).then(() => {
      showNotification('Question copied to clipboard!', 'success');
    }).catch(() => {
      showNotification('Failed to copy question', 'error');
    });
  });
}

// Show notification
function showNotification(message, type) {
  // Remove any existing notifications first
  const existingNotification = document.querySelector('.sat-quiz-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `sat-quiz-notification sat-quiz-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('sat-quiz-notification-show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('sat-quiz-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .sat-quiz-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 99999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease-out;
  }

  .sat-quiz-notification-show {
    opacity: 1;
    transform: translateX(0);
  }

  .sat-quiz-notification-success {
    background: #10b981;
    color: white;
  }

  .sat-quiz-notification-error {
    background: #ef4444;
    color: white;
  }
`;
document.head.appendChild(style);

// Watch for modal opening and add buttons
const observer = new MutationObserver(() => {
  const modal = document.querySelector('.cb-modal.cb-open');
  if (modal) {
    // Wait a bit for the modal to fully render
    setTimeout(addQuizButtons, 100);
  }
});

observer.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});

// Also try to add buttons if modal is already open
setTimeout(addQuizButtons, 500);