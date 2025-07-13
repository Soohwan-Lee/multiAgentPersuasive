import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Bot } from "lucide-react";
import Link from "next/link";

const dummyMessages = [
  { sender: "agent", name: "Agent A", text: "안녕하세요. 오늘의 주제는 '사회적 설득'입니다." },
  { sender: "agent", name: "Agent C", text: "저는 Agent C입니다. 여러분의 의견이 궁금합니다." },
  { sender: "user", name: "나", text: "네, 다양한 의견을 나눠보고 싶어요." },
];

export default function Experiment() {
  const [input, setInput] = useState("");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold text-center">실험 세션</h1>
      <p className="text-center">이제 본 실험이 시작됩니다.<br />여러 에이전트와 주어진 주제에 대해 대화해 주세요.</p>
      <div className="w-full max-w-md flex flex-col gap-2 border rounded-lg p-4 bg-white/80 shadow">
        <div className="flex flex-col gap-2 h-60 overflow-y-auto">
          {dummyMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}> 
              <div className={`flex items-center gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                {msg.sender === "agent" ? <Bot className="w-5 h-5 text-green-500" /> : <User className="w-5 h-5 text-gray-500" />}
                <div className={`rounded-lg px-3 py-2 ${msg.sender === "agent" ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-800"}`}>
                  <span className="block text-xs font-semibold">{msg.name}</span>
                  <span>{msg.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 border rounded p-2"
            placeholder="메시지를 입력하세요 (동작 안함)"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled
          />
          <Button disabled>전송</Button>
        </div>
      </div>
      <Link href="/post-survey">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 