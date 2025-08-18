import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-bold">Multi-Agent Persuasive Experiment</h1>
      <p className="max-w-lg">
        This experiment explores social influence and persuasion processes through conversations with multiple AI agents.<br />
        The experiment consists of a background survey, practice session, main experiment, and post-survey.<br />
        Click 'Start' to begin the experiment.
      </p>
      <Link href="/entry">
        <Button>Start</Button>
      </Link>
    </main>
  );
}
