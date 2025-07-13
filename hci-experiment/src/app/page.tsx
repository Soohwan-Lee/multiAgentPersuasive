import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-bold">HCI 실험: 멀티 에이전트의 사회적 영향력</h1>
      <p className="max-w-lg">
        본 실험은 여러 인공지능 에이전트와의 대화를 통해 사회적 영향력과 설득 과정을 탐구합니다.<br />
        실험은 사전 설문, 연습 세션, 본 실험, 사후 설문 순서로 진행됩니다.<br />
        아래 ‘다음’ 버튼을 눌러 설문을 시작하세요.
      </p>
      <Link href="/pre-survey">
        <Button>다음</Button>
      </Link>
    </main>
  );
}
