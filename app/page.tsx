import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
      <div className="bg-white rounded-xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">HCI 실험 안내</h1>
        <p className="mb-6 text-gray-600">이 실험은 멀티 에이전트와의 대화를 포함합니다.<br/>아래 버튼을 눌러 시작해 주세요.</p>
        <a href="/pre-survey" className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">사전 설문 시작하기</a>
      </div>
    </main>
  );
} 