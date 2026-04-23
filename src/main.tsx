import './index.css';

/**
 * Placeholder for backend interaction.
 */
function recordChoice(choice: 'try_again' | 'let_go') {
  console.log('Recorded choice:', choice);
  // Implementation for backend would go here.
}

interface ScreenData {
  id: string;
  lines: string[];
  buttons: { text: string; action: string | (() => void) }[];
}

const screens: Record<string, ScreenData> = {
  opening: {
    id: 'opening',
    lines: ['Hey. This is just to clear things.'],
    buttons: [{ text: 'Continue', action: 'activate:acknowledge' }]
  },
  acknowledge: {
    id: 'acknowledge',
    lines: [
      'I know I hurt you before.',
      'I get why things changed between us.'
    ],
    buttons: [{ text: 'Next', action: 'activate:current_state' }]
  },
  current_state: {
    id: 'current_state',
    lines: [
      'Right now this doesn’t feel the same to me.',
      'I dont feel much effort from your side.'
    ],
    buttons: [{ text: 'Next', action: 'activate:boundary' }]
  },
  boundary: {
    id: 'boundary',
    lines: ['I cant carry this on my own.'],
    buttons: [{ text: 'Next', action: 'activate:pre_choice' }]
  },
  pre_choice: {
    id: 'pre_choice',
    lines: [
      'We’ve had this talk before.',
      'I don’t want to keep repeating it.'
    ],
    buttons: [{ text: 'Next', action: 'activate:thats_why' }]
  },
  thats_why: {
    id: 'thats_why',
    lines: ['thats why...'],
    buttons: [{ text: 'Next', action: 'activate:choice' }]
  },
  choice: {
    id: 'choice',
    lines: [
      'Make a decision. Be honest with me.',
      'Your actions haven’t reflected the choice you made last time.'
    ],
    buttons: [
      { text: 'Try one last time', action: 'branch:try_again' },
      { text: 'Let it go', action: 'branch:let_go' }
    ]
  },
  try_again_branch: {
    id: 'try_again_branch',
    lines: ['Then this is really the last time. It needs to be different.'],
    buttons: [{ text: 'Next', action: 'activate:final' }]
  },
  let_go_branch: {
    id: 'let_go_branch',
    lines: ['If you want to let go, I’ll respect your decision.'],
    buttons: [{ text: 'Next', action: 'activate:final' }]
  },
  final: {
    id: 'final',
    lines: [
      'I’ll understand, whatever you decide.',
      'Tell me on Pinterest what you chose.'
    ],
    buttons: [{ text: 'Done', action: 'finalize' }]
  }
};

let navigationHistory: string[] = [];
let currentScreenId: string = 'opening';
let recordedChoice: 'try_again' | 'let_go' | null = null;

function renderScreen(screenId: string, pushToHistory: boolean = true) {
  const root = document.getElementById('root');
  if (!root) return;

  const data = screens[screenId];
  if (!data) return;

  if (pushToHistory && currentScreenId !== screenId) {
    navigationHistory.push(currentScreenId);
  }
  currentScreenId = screenId;

  // Create screen element
  const screenEl = document.createElement('div');
  screenEl.className = 'screen';
  screenEl.id = `screen-${data.id}`;

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  data.lines.forEach(line => {
    const p = document.createElement('p');
    p.className = 'line';
    p.textContent = line;
    textContainer.appendChild(p);
  });
  screenEl.appendChild(textContainer);

  const btnContainer = document.createElement('div');
  btnContainer.className = 'btn-container';

  // Add Back arrow if history exists and not on final screen
  if (navigationHistory.length > 0 && screenId !== 'final') {
    const backArrow = document.createElement('button');
    backArrow.className = 'back-arrow';
    backArrow.innerHTML = '←';
    backArrow.onclick = () => goBack();
    screenEl.appendChild(backArrow);
  }

  data.buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = 'btn';
    button.textContent = btn.text;
    button.onclick = () => handleAction(btn.action);
    btnContainer.appendChild(button);
  });
  screenEl.appendChild(btnContainer);

  root.appendChild(screenEl);

  // Trigger fade in on next frame
  requestAnimationFrame(() => {
    screenEl.classList.add('active');
  });
}

function goBack() {
  const previousScreenId = navigationHistory.pop();
  if (previousScreenId) {
    // If going back, we might need to reset choice if we leave branch screens
    if (previousScreenId === 'choice') recordedChoice = null;
    transitionTo(previousScreenId, false);
  }
}

function transitionTo(screenId: string, pushToHistory: boolean = true) {
  const currentActive = document.querySelector('.screen.active');
  if (currentActive) {
    currentActive.classList.remove('active');
    setTimeout(() => {
      currentActive.remove();
    }, 800);
  }

  setTimeout(() => {
    renderScreen(screenId, pushToHistory);
  }, 800);
}

function handleAction(action: string | (() => void)) {
  if (typeof action === 'function') {
    action();
    return;
  }

  const [type, value] = action.split(':');
  
  switch (type) {
    case 'activate':
      transitionTo(value);
      break;
    case 'branch':
      recordedChoice = value as 'try_again' | 'let_go';
      if (value === 'try_again') transitionTo('try_again_branch');
      if (value === 'let_go') transitionTo('let_go_branch');
      break;
    case 'finalize':
      if (recordedChoice) {
        recordChoice(recordedChoice);
      }
      
      const currentActive = document.querySelector('.screen.active');
      if (currentActive) {
        currentActive.classList.remove('active');
        
        setTimeout(() => {
          currentActive.remove();
          
          // Create reset screen
          const resetScreen = document.createElement('div');
          resetScreen.className = 'screen';
          resetScreen.style.opacity = '0';
          resetScreen.innerHTML = '<p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2rem; opacity: 0.2;">This will reset.</p>';
          document.getElementById('root')?.appendChild(resetScreen);
          
          requestAnimationFrame(() => {
            resetScreen.style.transition = 'opacity 1.5s ease-in-out';
            resetScreen.style.opacity = '1';
          });

          // Reload after 4 seconds
          setTimeout(() => {
            resetScreen.style.opacity = '0';
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }, 3000);
        }, 800);
      }
      break;
  }
}

// Initial render
function init() {
  const root = document.getElementById('root');
  if (root) {
    // Add decorative elements once
    const frame = document.createElement('div');
    frame.className = 'editorial-frame';
    
    root.appendChild(frame);
  }
  renderScreen('opening');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
