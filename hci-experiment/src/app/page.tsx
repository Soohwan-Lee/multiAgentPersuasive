import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-bold">HCI 실험에 오신 것을 환영합니다</h1>
      <p className="max-w-lg">
        이 실험에서는 멀티 에이전트와의 채팅 및 설문 작성을 통해 사용자 경험을 연구합니다.
      </p>
      <Link href="/pre-survey">
        <Button>다음으로</Button>
      </Link>
    </main>
  );
}
