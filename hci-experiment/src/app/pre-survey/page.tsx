import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PreSurvey() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">사전 설문</h1>
      <p>여기에 사전 설문 폼이 들어갑니다.</p>
      <Link href="/practice">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 