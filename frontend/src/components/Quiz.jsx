import { useState } from "react";

export default function Quiz({ onClose, t = {}, questions = [] }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const quizQuestions = questions;
  const question = quizQuestions[current];
  const selected = answers[current];
  const correctCount = quizQuestions.filter(
    (item, index) => answers[index] === item.answer
  ).length;

  const percentage = Math.round((correctCount / quizQuestions.length) * 100);

  function chooseAnswer(index) {
    if (selected !== undefined) return;

    setAnswers((previous) => ({
      ...previous,
      [current]: index,
    }));
  }

  function nextQuestion() {
    if (current < quizQuestions.length - 1) {
      setCurrent((previous) => previous + 1);
    } else {
      setFinished(true);
    }
  }

  function restartQuiz() {
    setCurrent(0);
    setAnswers({});
    setFinished(false);
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-window">
        <button className="quiz-close" onClick={onClose} aria-label={t.closeQuiz}>
          ✕ {t.closeQuiz}
        </button>

        {!finished && question ? (
          <>
            <span className="section-kicker dark">
              LEVEL UP / {String(t.knowledgeCheck).toUpperCase()}
            </span>

            <h2>{t.knowledgeCheck}</h2>

            <div className="quiz-progress">
              <div style={{ width: `${((current + 1) / quizQuestions.length) * 100}%` }} />
            </div>

            <p className="quiz-counter">
              {t.questionLabel} {current + 1} / {quizQuestions.length}
            </p>

            <h3 className="quiz-question">{question.question}</h3>

            <div className="quiz-options">
              {question.options.map((option, index) => {
                let className = "quiz-option";

                if (selected !== undefined) {
                  if (index === question.answer) {
                    className += " correct";
                  } else if (index === selected) {
                    className += " incorrect";
                  }
                }

                return (
                  <button
                    key={option}
                    className={className}
                    onClick={() => chooseAnswer(index)}
                    disabled={selected !== undefined}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {selected !== undefined && (
              <div className="quiz-explanation">
                <strong>{selected === question.answer ? t.correctAnswer : t.notQuite}</strong>
                <p>{question.explanation}</p>
              </div>
            )}

            <button className="btn btn-primary quiz-next" disabled={selected === undefined} onClick={nextQuestion}>
              {current === quizQuestions.length - 1 ? t.seeResults : `${t.next} →`}
            </button>
          </>
        ) : (
          <div className="quiz-result">
            <div className="result-icon">{percentage >= 80 ? "🏆" : percentage >= 50 ? "🎉" : "📚"}</div>

            <span className="section-kicker dark">{t.quizComplete.toUpperCase()}</span>

            <h2>
              {percentage >= 80
                ? t.excellentWork
                : percentage >= 50
                ? t.niceJob
                : t.keepLearning}
            </h2>

            <div className="result-score">{percentage}%</div>

            <p>
              {t.answeredSummary
                .replace("{count}", String(correctCount))
                .replace("{total}", String(quizQuestions.length))}
            </p>

            <div className="result-actions">
              <button className="btn btn-secondary" onClick={restartQuiz}>
                {t.tryAgain}
              </button>

              <button className="btn btn-primary" onClick={onClose}>
                {t.returnToCourse}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
