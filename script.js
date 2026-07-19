const QUESTIONS_PER_QUIZ = 10;

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
const resultMessageEl = document.getElementById("result-message");
const restartBtn = document.getElementById("restart-btn");

let currentIndex = 0;
let score = 0;
let quizQuestions = [];
let questionPool = [];

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
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    renderQuestion();
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
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalScoreEl.textContent = `${score} / ${quizQuestions.length}`;

    let message;
    if (score === quizQuestions.length) {
        message = "満点！素晴らしい！";
    } else if (score >= 8) {
        message = "とてもよくできました！";
    } else if (score >= 5) {
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

(async function init() {
    try {
        questionPool = await loadQuestions();
        startQuiz();
    } catch (err) {
        showLoadError(err.message || "問題の読み込みに失敗しました");
    }
})();
