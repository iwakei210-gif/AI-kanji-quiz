const QUESTIONS_PER_QUIZ = 20;
const HISTORY_STORAGE_KEY = "kanji-quiz-history";
const HISTORY_MAX_ENTRIES = 50;
const HISTORY_DISPLAY_LIMIT = 5;

const kanjiEl = document.getElementById("kanji");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const resultTextEl = document.getElementById("result-text");
const correctAnswerEl = document.getElementById("correct-answer");
const nextBtn = document.getElementById("next-btn");
const questionNumberEl = document.getElementById("question-number");
const scoreDisplayEl = document.getElementById("score-display");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const finalScoreEl = document.getElementById("final-score");
const resultDurationEl = document.getElementById("result-duration");
const resultMessageEl = document.getElementById("result-message");
const restartBtn = document.getElementById("restart-btn");
const historyStatsEl = document.getElementById("history-stats");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

let currentIndex = 0;
let score = 0;
let quizQuestions = [];
let questionPool = [];
let quizStartAt = 0;

function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function loadQuestions() {
    const res = await fetch("questions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`questions.json の読み込みに失敗しました (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length < QUESTIONS_PER_QUIZ) {
        throw new Error("questions.json の問題数が不足しています");
    }
    return data;
}

function pickQuizQuestions() {
    return shuffle(questionPool).slice(0, QUESTIONS_PER_QUIZ);
}

function startQuiz() {
    currentIndex = 0;
    score = 0;
    quizQuestions = pickQuizQuestions();
    quizStartAt = Date.now();
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    renderQuestion();
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveHistory(history) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        // localStorageが使えない場合は静かに失敗
    }
}

function appendHistoryEntry(entry) {
    const history = loadHistory();
    history.push(entry);
    if (history.length > HISTORY_MAX_ENTRIES) {
        history.splice(0, history.length - HISTORY_MAX_ENTRIES);
    }
    saveHistory(history);
}

function formatDateTime(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${h}:${mi}`;
}

function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0) return `${min}分${sec}秒`;
    return `${sec}秒`;
}

function renderHistory() {
    const history = loadHistory();
    if (history.length === 0) {
        historyStatsEl.textContent = "まだ記録がありません。";
        historyListEl.innerHTML = "";
        return;
    }
    const count = history.length;
    const best = Math.max(...history.map(h => h.score));
    const total = history[history.length - 1].total;
    const avg = history.reduce((sum, h) => sum + h.score, 0) / count;
    historyStatsEl.innerHTML =
        `挑戦回数: <strong>${count}</strong>回 / ` +
        `ベスト: <strong>${best} / ${total}</strong> / ` +
        `平均: <strong>${avg.toFixed(1)}</strong>点`;

    const recent = history.slice(-HISTORY_DISPLAY_LIMIT).reverse();
    historyListEl.innerHTML = recent.map(h => `
        <li class="history-item">
            <span class="history-date">${formatDateTime(h.at)}</span>
            <span class="history-score">${h.score} / ${h.total}</span>
            <span class="history-duration">${formatDuration(h.durationMs)}</span>
        </li>
    `).join("");
}

function clearHistory() {
    if (!confirm("これまでの記録をすべて消しますか？")) return;
    try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {}
    renderHistory();
}

function renderQuestion() {
    feedbackEl.classList.add("hidden");
    const q = quizQuestions[currentIndex];
    kanjiEl.textContent = q.kanji;
    questionNumberEl.textContent = `問題 ${currentIndex + 1} / ${quizQuestions.length}`;
    scoreDisplayEl.textContent = `正解: ${score}`;

    choicesEl.innerHTML = "";
    const shuffled = shuffle(q.choices);
    shuffled.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.textContent = choice;
        btn.addEventListener("click", () => handleAnswer(btn, choice, q.answer));
        choicesEl.appendChild(btn);
    });
}

function handleAnswer(clickedBtn, selected, correct) {
    const buttons = choicesEl.querySelectorAll(".choice-btn");
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
            btn.classList.add("correct");
        }
    });

    const isCorrect = selected === correct;
    if (isCorrect) {
        score++;
        resultTextEl.textContent = "正解！";
        resultTextEl.className = "result-text correct";
    } else {
        clickedBtn.classList.add("wrong");
        resultTextEl.textContent = "不正解";
        resultTextEl.className = "result-text wrong";
    }

    correctAnswerEl.textContent = `正しい読み方: ${correct}`;
    scoreDisplayEl.textContent = `正解: ${score}`;
    feedbackEl.classList.remove("hidden");
}

function goNext() {
    currentIndex++;
    if (currentIndex >= quizQuestions.length) {
        showResult();
    } else {
        renderQuestion();
    }
}

function showResult() {
    const total = quizQuestions.length;
    const durationMs = Date.now() - quizStartAt;

    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalScoreEl.textContent = `${score} / ${total}`;
    resultDurationEl.textContent = `所要時間: ${formatDuration(durationMs)}`;

    appendHistoryEntry({
        at: Date.now(),
        score: score,
        total: total,
        durationMs: durationMs
    });
    renderHistory();

    let message;
    if (score === total) {
        message = "満点！素晴らしい！";
    } else if (score >= total * 0.8) {
        message = "とてもよくできました！";
    } else if (score >= total * 0.5) {
        message = "よくがんばりました！";
    } else {
        message = "もう一度チャレンジしてみよう！";
    }
    resultMessageEl.textContent = message;
}

function showLoadError(message) {
    quizScreen.innerHTML = `<div class="load-error"><p>${message}</p><p class="load-error-hint">ページを再読み込みしてください。</p></div>`;
    quizScreen.classList.remove("hidden");
    resultScreen.classList.add("hidden");
}

nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", startQuiz);
clearHistoryBtn.addEventListener("click", clearHistory);

(async function init() {
    try {
        questionPool = await loadQuestions();
        startQuiz();
    } catch (err) {
        showLoadError(err.message || "問題の読み込みに失敗しました");
    }
})();
