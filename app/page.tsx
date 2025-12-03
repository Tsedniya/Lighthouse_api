import Light  from '../components/Light';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-2xl">
        <Light/>
      </div>
    </div>
  );
}
