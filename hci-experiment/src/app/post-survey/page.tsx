import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostSurvey() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">사후 설문</h1>
      <p>이곳에 사후 설문 폼이 들어갑니다.</p>
      <Link href="/done">
        <Button>실험 종료</Button>
      </Link>
    </main>
  );
} 