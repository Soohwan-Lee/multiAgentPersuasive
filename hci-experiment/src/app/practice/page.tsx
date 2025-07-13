import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Practice() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">연습 세션</h1>
      <p>이곳에서 에이전트들과 채팅을 연습해보세요.</p>
      <Link href="/experiment">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 