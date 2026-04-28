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
    lines: ['Hey!', 'Just something to look at when you need a break from the books'],
    buttons: [{ text: 'Go ahead', action: 'activate:check_in' }]
  },
  check_in: {
    id: 'check_in',
    lines: [
      'I know Class 11 is moving really fast right now',
      'I just hope you’re actually taking some time for yourself'
    ],
    buttons: [
      { text: 'Doing my best', action: 'activate:concern_trying' },
      { text: 'It is a lot', action: 'activate:concern_barely' }
    ]
  },
  concern_trying: {
    id: 'concern_trying',
    lines: [
      'That’s so you. You’ve always been so dedicated to everything you do',
      'Just please don’t forget to give yourself a break once in a while'
    ],
    buttons: [{ text: 'I will', action: 'activate:friendship' }]
  },
  concern_barely: {
    id: 'concern_barely',
    lines: [
      'I get it, it’s a lot to carry all at once',
      'Just wanted to remind you that you’re doing great. Please take care of yourself!!'
    ],
    buttons: [{ text: 'I appreciate it', action: 'activate:friendship' }]
  },
  friendship: {
    id: 'friendship',
    lines: [
      'Honestly, I’m just really glad we’ve been talking more lately',
      'It makes these long days feel a bit more manageable'
    ],
    buttons: [{ text: 'Me too', action: 'activate:uplift' }]
  },
  uplift: {
    id: 'uplift',
    lines: [
      'Anyway, don’t let the stress get to you too much',
      'I’m always rooting for you'
    ],
    buttons: [{ text: 'Next', action: 'activate:choice' }]
  },
  choice: {
    id: 'choice',
    lines: [
      'And if you ever need a break or someone to vent to...',
      'I’m always there for you!!'
    ],
    buttons: [
      { text: 'That means a lot', action: 'branch:let_go' }
    ]
  },
  try_again_branch: {
    id: 'try_again_branch',
    lines: ['Good luck with the studies! I’ll be here whenever you need a distraction'],
    buttons: [{ text: 'Next', action: 'activate:final_plus' }]
  },
  let_go_branch: {
    id: 'let_go_branch',
    lines: ['Of course. Just keep doing your thing and don’t overwork yourself'],
    buttons: [{ text: 'Next', action: 'activate:final_normal' }]
  },
  final_plus: {
    id: 'final_plus',
    lines: [
      'That’s all I wanted to say',
      'Take care of yourself!!'
    ],
    buttons: [{ text: 'Done', action: 'finalize' }]
  },
  final_normal: {
    id: 'final_normal',
    lines: [
      'That’s all I wanted to say',
      'Take care of yourself!!'
    ],
    buttons: [{ text: 'Done', action: 'finalize' }]
  }
};

// --- Sound Logic ---
const AudioEngine = {
  ctx: null as AudioContext | null,
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  },

  play(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  click() {
    this.play(800, 'triangle', 0.1, 0.2);
  },

  transition() {
    this.play(400, 'triangle', 0.3, 0.1);
  }
};

const navigationHistory: string[] = [];
let clickCount = 0;
let currentScreenId: string = 'opening';
let recordedChoice: 'try_again' | 'let_go' | null = null;
let hasNavigatedBack: boolean = false;

function renderScreen(screenId: string, pushToHistory: boolean = true) {
  const root = document.getElementById('root');
  if (!root) return;

  AudioEngine.transition();

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
  if (navigationHistory.length > 0 && !screenId.startsWith('final')) {
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
    button.onclick = () => {
      AudioEngine.init();
      AudioEngine.click();
      handleAction(btn.action);
    };
    btnContainer.appendChild(button);
  });
  screenEl.appendChild(btnContainer);

  root.appendChild(screenEl);

  // Show curiosity message if they went back
  if (hasNavigatedBack) {
    showCuriosityMsg();
    hasNavigatedBack = false;
  }

  // Trigger fade in on next frame
  requestAnimationFrame(() => {
    screenEl.classList.add('active');
  });
}

function showCuriosityMsg() {
  const existing = document.querySelector('.curiosity-msg');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = 'curiosity-msg';
  msg.textContent = 'I knew it! You are very curious 😭';
  document.getElementById('root')?.appendChild(msg);

  setTimeout(() => msg.classList.add('active'), 100);
  setTimeout(() => {
    msg.classList.remove('active');
    setTimeout(() => msg.remove(), 500);
  }, 3000);
}

function goBack() {
  const previousScreenId = navigationHistory.pop();
  if (previousScreenId) {
    hasNavigatedBack = true;
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
          resetScreen.innerHTML = '<p style="font-size: 10px; text-transform: lowercase; letter-spacing: 0.2rem; opacity: 0.2;">this will reset</p>';
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

function showSecretMsg(text: string) {
  const existing = document.querySelector('.curiosity-msg');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = 'curiosity-msg';
  msg.textContent = text;
  document.getElementById('root')?.appendChild(msg);

  setTimeout(() => msg.classList.add('active'), 100);
  setTimeout(() => {
    msg.classList.remove('active');
    setTimeout(() => msg.remove(), 500);
  }, 4000);
}

// Initial render
function init() {
  const root = document.getElementById('root');
  if (root) {
    // Add decorative elements once
    const frame = document.createElement('div');
    frame.className = 'editorial-frame';
    
    const label = document.createElement('div');
    label.className = 'editorial-label';
    label.textContent = 'Mood';
    
    // Obvious sparkle egg
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-egg';
    sparkle.innerHTML = '✨';
    sparkle.onclick = (e) => {
      e.stopPropagation();
      AudioEngine.init();
      AudioEngine.play(1200, 'sine', 0.2, 0.1);
      showSecretMsg('Stay kind to yourself. You deserve it. 🤍');
    };
    
    root.appendChild(frame);
    root.appendChild(label);
    root.appendChild(sparkle);
  }
  renderScreen('opening');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
