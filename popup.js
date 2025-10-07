let savedQuestions = [];

// Load saved questions on popup open
chrome.storage.local.get(['questions'], (result) => {
  savedQuestions = result.questions || [];
  updateQuestionCount();
  updateStartButton();
});

// Update question count display
function updateQuestionCount() {
  document.getElementById('questionCount').textContent = savedQuestions.length;
}

// Enable/disable start quiz button
function updateStartButton() {
  const startBtn = document.getElementById('startQuizBtn');
  if (savedQuestions.length > 0) {
    startBtn.classList.remove('disabled');
  } else {
    startBtn.classList.add('disabled');
  }
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// Extract question from current page
document.getElementById('extractBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Allow extraction from any page for testing purposes
    // Remove this check if you want to enforce College Board only
    // if (!tab.url.includes('satsuitequestionbank.collegeboard.org')) {
    //   showStatus('Please navigate to the SAT Question Bank first', 'error');
    //   return;
    // }

    showStatus('Extracting question...', 'info');

    chrome.tabs.sendMessage(tab.id, { action: 'extractQuestion' }, (response) => {
      if (chrome.runtime.lastError) {
        // If content script isn't loaded, inject it
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          // Try again after injection
          chrome.tabs.sendMessage(tab.id, { action: 'extractQuestion' }, handleResponse);
        }).catch(err => {
          showStatus('Error: Cannot access this page', 'error');
        });
        return;
      }

      handleResponse(response);
    });

    function handleResponse(response) {
      if (response && response.question) {
        savedQuestions.push(response.question);
        chrome.storage.local.set({ questions: savedQuestions });
        updateQuestionCount();
        updateStartButton();
        showStatus('Question added successfully!', 'success');
      } else {
        showStatus('Question extracted (may need manual editing)', 'info');
        if (response && response.question) {
          savedQuestions.push(response.question);
          chrome.storage.local.set({ questions: savedQuestions });
          updateQuestionCount();
          updateStartButton();
        }
      }
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

// Start quiz
document.getElementById('startQuizBtn').addEventListener('click', () => {
  if (savedQuestions.length === 0) {
    showStatus('No questions available', 'error');
    return;
  }

  // Open quiz in new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('quiz.html') });
});

// Clear all questions
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all questions?')) {
    savedQuestions = [];
    chrome.storage.local.set({ questions: [] });
    updateQuestionCount();
    updateStartButton();
    showStatus('All questions cleared', 'info');
  }
});