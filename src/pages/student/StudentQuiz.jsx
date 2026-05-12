import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { quizQuestions } from '../../services/demoData';

export function StudentQuiz() {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const question = quizQuestions[0];

  return (
    <DashboardLayout role="student" title="Quiz Pemahaman" subtitle="Uji pemahamanmu dengan feedback langsung.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <button><ArrowLeft className="h-5 w-5" /></button>
            <p className="font-bold">Modul 5 · Kuis Pemahaman</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">2 / 5</span>
          </div>
          <div className="mb-8 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/5 rounded-full bg-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-extrabold">{question.question}</h2>
          <div className="mt-6 space-y-3">
            {question.answers.map((answer, index) => {
              const isCorrect = selected !== null && index === question.correct;
              const isWrong = selected === index && index !== question.correct;
              return (
                <button
                  key={answer}
                  onClick={() => setSelected(index)}
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
          {selected !== null && (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <strong>Pembahasan:</strong> {question.explanation}
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="secondary">Sebelumnya</Button>
            <Button onClick={() => setDone(true)}>Selanjutnya <ArrowRight className="h-4 w-4" /></Button>
          </div>
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
              <h2 className="mt-5 font-display text-3xl font-extrabold">{done ? 'Kuis Selesai!' : 'Target Skor'}</h2>
              <p className="mt-4 font-display text-5xl font-extrabold text-emerald-900">{done ? '80' : '85'}<span className="text-xl text-slate-400"> /100</span></p>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-500">Kerja bagus! Terus tingkatkan pemahamanmu dan lanjutkan refleksi setelah kuis.</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
