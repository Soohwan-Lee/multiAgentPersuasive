import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PreSurvey() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">사전 설문</h1>
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto text-left">
        <label>
          나이
          <input className="w-full border rounded p-2 mt-1" placeholder="예: 25" disabled />
        </label>
        <label>
          성별
          <select className="w-full border rounded p-2 mt-1" disabled>
            <option>남성</option>
            <option>여성</option>
            <option>기타/응답 거부</option>
          </select>
        </label>
        <label>
          평소 AI 사용 경험
          <input className="w-full border rounded p-2 mt-1" placeholder="예: 챗봇, 음성비서 등" disabled />
        </label>
      </div>
      <Link href="/practice">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 