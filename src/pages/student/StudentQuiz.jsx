import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Trophy } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { completeModule, fetchQuizzes } from '../../services/learningService';
import { useAuth } from '../../hooks/useAuth';

const answerKeys = ['a', 'b', 'c', 'd'];

export function StudentQuiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const question = quizzes[current];
  const selected = answers[question?.id];
  const score = useMemo(() => {
    if (!quizzes.length) return 0;
    const correct = quizzes.filter((quiz) => answers[quiz.id] === quiz.correct_answer).length;
    return Math.round((correct / quizzes.length) * 100);
  }, [answers, quizzes]);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchQuizzes();
        setQuizzes(rows);
      } catch (nextError) {
        setError(nextError.message || 'Kuis gagal dimuat.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function finishQuiz() {
    setDone(true);
    const moduleId = quizzes.find((quiz) => quiz.module_id)?.module_id;
    if (user?.id && moduleId) {
      await completeModule(user.id, moduleId, score);
    }
  }

  const options = question
    ? [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ]
    : [];

  return (
    <DashboardLayout role="student" title="Quiz Pemahaman" subtitle="Uji pemahamanmu dengan feedback langsung.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          {loading && <p className="text-sm font-semibold text-slate-500">Memuat kuis...</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          {!loading && quizzes.length === 0 && (
            <div className="rounded-3xl bg-slate-50 p-8 text-center">
              <p className="font-display text-2xl font-bold">Belum ada kuis.</p>
              <p className="mt-2 text-slate-500">Kuis akan muncul setelah guru menambahkannya di Supabase.</p>
            </div>
          )}
          {question && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="font-bold">Kuis Pemahaman</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{current + 1} / {quizzes.length}</span>
              </div>
              <div className="mb-8 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${((current + 1) / quizzes.length) * 100}%` }} />
              </div>
              <h2 className="font-display text-2xl font-extrabold">{question.question}</h2>
              <div className="mt-6 space-y-3">
                {options.map((answer, index) => {
                  const key = answerKeys[index];
                  const isCorrect = selected && key === question.correct_answer;
                  const isWrong = selected === key && key !== question.correct_answer;
                  return (
                    <button
                      key={key}
                      onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: key }))}
                      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left font-semibold transition ${
                        isCorrect ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : isWrong ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + index)}. {answer}</span>
                      {isCorrect && <CheckCircle2 className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
              {selected && question.explanation && (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <strong>Pembahasan:</strong> {question.explanation}
                </div>
              )}
              <div className="mt-6 flex justify-between">
                <Button variant="secondary" onClick={() => setCurrent((value) => Math.max(value - 1, 0))}>Sebelumnya</Button>
                {current === quizzes.length - 1 ? (
                  <Button onClick={finishQuiz} disabled={!selected}>Selesai <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button onClick={() => setCurrent((value) => Math.min(value + 1, quizzes.length - 1))} disabled={!selected}>Selanjutnya <ArrowRight className="h-4 w-4" /></Button>
                )}
              </div>
            </>
          )}
        </Card>
        <Card className="grid place-items-center overflow-hidden p-0 text-center">
          <div>
            <div className="relative h-64 w-full overflow-hidden bg-emerald-50">
              <img src="/assets/wasatify-reflection-quiz.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-7">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-gold">
                <Trophy className="h-10 w-10" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-extrabold">{done ? 'Kuis Selesai!' : 'Skor Sementara'}</h2>
              <p className="mt-4 font-display text-5xl font-extrabold text-emerald-900">{score}<span className="text-xl text-slate-400"> /100</span></p>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-500">Jawaban tersimpan selama sesi kuis dan skor akhir dicatat ke progress modul.</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
