import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostSurvey() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">사후 설문</h1>
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto text-left">
        <label>
          실험을 마친 소감
          <textarea className="w-full border rounded p-2 mt-1" rows={3} placeholder="자유롭게 작성해 주세요" disabled />
        </label>
        <label>
          에이전트의 설득력/신뢰감에 대한 평가
          <input className="w-full border rounded p-2 mt-1" placeholder="예: 매우 설득력 있음" disabled />
        </label>
      </div>
      <Link href="/done">
        <Button>실험 종료</Button>
      </Link>
    </main>
  );
} 