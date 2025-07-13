import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Experiment() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">실험 세션</h1>
      <p>실험용 멀티 에이전트 채팅 인터페이스가 이곳에 위치합니다.</p>
      <Link href="/post-survey">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 