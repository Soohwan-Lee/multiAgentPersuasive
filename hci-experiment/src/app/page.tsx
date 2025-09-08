import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-bold">Multi-Agent Chat Experiment</h1>
      <p className="max-w-lg">
        This study explores decision-making after brief chats with multiple AI assistants.<br />
        It includes a background survey, a short practice, two chat sessions, and short post-session surveys.<br />
        Click 'Start' to begin the experiment.
      </p>
      <Link href="/entry">
        <Button>Start</Button>
      </Link>
    </main>
  );
}
