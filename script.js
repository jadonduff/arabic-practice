let wordBank = [];
let questionQueue = [];
let stats = { asked: 0, correct: 0, points: 0, total: 0 };

const modal = document.getElementById('practice-modal');
const btnNew    = document.getElementById('new-practice-btn');
const btnFloat  = document.getElementById('mobile-float-btn');
const btnClose  = document.getElementById('practice-close');
const btnBegin  = document.getElementById('begin-practice');
const inputW    = document.getElementById('num-words');
const inputQ    = document.getElementById('num-questions');

const arabicEl  = document.getElementById('current-word');
const inputDesk = document.getElementById('translation-input');
const inputMob  = document.getElementById('translation-input-mobile');
const btnSubmit = document.getElementById('submit-btn');
const btnReveal = document.getElementById('reveal-btn');

const statsEl = {
  practiced: document.getElementById('words-practiced'),
  percent:   document.getElementById('percent-complete'),
  accuracy:  document.getElementById('accuracy'),
  points:    document.getElementById('points'),
  header:    document.getElementById('header-stat'),
};
const banner = document.getElementById('feedback-banner');

let fullList = [];
fetch('wordlist.csv')
  .then(r => r.text())
  .then(text => {
    fullList = text.trim().split('\n').map(line => {
      const [arabic, eng] = line.split(',');
      return { arabic, english: eng.split('/') };
    });
  });

// open modal
btnNew.addEventListener('click',   () => modal.style.display = 'block');
btnFloat.addEventListener('click', () => modal.style.display = 'block');
btnClose.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});

// Enter in modal → Begin
[inputW, inputQ].forEach(i =>
  i.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnBegin.click();
    }
  })
);

btnBegin.addEventListener('click', () => {
  const wCount = +inputW.value, qCount = +inputQ.value;
  if (!wCount || !qCount || wCount > fullList.length) {
    return alert('Enter valid numbers');
  }

  wordBank = fullList.slice(0, wCount);
  const weights = wordBank.map((_, i) =>
    1 + (wCount>1 ? (i/(wCount-1))*0.2 : 0)
  );

  questionQueue = [];
  for (let i=0; i<qCount; i++) {
    const totalW = weights.reduce((a,b)=>a+b,0);
    let rnd = Math.random()*totalW, idx=0;
    while (rnd > weights[idx]) rnd -= weights[idx++];
    questionQueue.push(wordBank[idx]);
    weights[idx] = Math.max(weights[idx]*0.5, 0.1);
  }

  stats = { asked:0, correct:0, points:0, total:qCount };
  modal.style.display = 'none';
  updateStats();
  nextQuestion();
});

function nextQuestion() {
    inputDesk.value = '';
    inputMob.value  = '';
    btnReveal.dataset.revealed = 'false';
  
    if (!questionQueue.length) return endPractice();
  
    // Force a reflow to make sure the browser processes the input clearing before showing the new word
    void arabicEl.offsetHeight; // This forces a reflow

    // Now update the Arabic word
    const w = questionQueue.shift();
    arabicEl.textContent = w.arabic;
    arabicEl.dataset.english = JSON.stringify(w.english);
  
    // Update stats immediately
    updateStats();
}

  
  

btnSubmit.addEventListener('click',() => checkAnswer(false));
btnReveal.addEventListener('click',() => checkAnswer(true));

// Enter desktop
inputDesk.addEventListener('keydown', e => {
  if (e.key==='Enter' && !e.shiftKey) {
    e.preventDefault();
    const ans = inputDesk.value; inputDesk.value='';
    checkAnswer(false, ans);
  }
});
// Enter mobile
inputMob.addEventListener('keydown', e => {
  if (e.key==='Enter') {
    e.preventDefault();
    const ans = inputMob.value; inputMob.value='';
    checkAnswer(false, ans);
  }
});

function checkAnswer(isReveal, forced=null) {
  const answer = forced!==null
    ? forced.trim().toLowerCase()
    : (inputDesk.value||inputMob.value).trim().toLowerCase();
  const possible = JSON.parse(arabicEl.dataset.english);
  const correct  = possible.some(o=>o.toLowerCase()===answer);

  stats.asked++;
  if (correct && !isReveal) {
    stats.correct++; stats.points++;
    showFeedback(true);
  } else {
    showFeedback(false, possible[0]);
    if (isReveal && btnReveal.dataset.revealed==='false') {
      inputDesk.value = possible[0];
      inputMob.value  = possible[0];
      btnReveal.dataset.revealed='true';
    }
  }

  updateStats();
  nextQuestion()
//   setTimeout(nextQuestion, isReveal?3000:700);
}

function showFeedback(ok, txt) {
  banner.textContent = ok? '✔ Correct' : `✖ Incorrect – ${txt}`;
  banner.className = `feedback-banner show ${
    ok?'feedback-correct':'feedback-incorrect'
  }`;
  setTimeout(()=>banner.classList.remove('show'),1500);
}

function updateStats() {
  const {asked, correct, points, total} = stats;
  const pct = total?Math.round((asked/total)*100):0;
  statsEl.practiced.textContent = `Words Practiced: ${asked}/${total}`;
  statsEl.percent.textContent  = `Percent Complete: ${pct}%`;
  statsEl.accuracy.textContent = `Accuracy: ${
    asked?Math.round((correct/asked)*100):0
  }%`;
  statsEl.points.textContent   = `Points: ${points} pts`;

  // header-percent on mobile
  statsEl.header.textContent = `${pct}% Complete`;

  // floating btn toggle
  if (window.innerWidth<=768) btnFloat.classList.remove('hidden');
  else btnFloat.classList.add('hidden');
}

function endPractice() {
  alert(
    `Practice complete!\n`+
    `Correct: ${stats.correct} / ${stats.asked}\nAccuracy: ${((stats.correct / stats.asked) * 100).toFixed(0)}%`
  );
  arabicEl.textContent = '-';
}
