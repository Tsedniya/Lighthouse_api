
'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const runLighthouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/lighthouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to analyze');

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8">Lighthouse Tester</h1>

        <form onSubmit={runLighthouse} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-5 py-4 text-lg border border-zinc-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-lg rounded-xl transition"
          >
            {loading ? 'Running Lighthouse...' : 'Run Lighthouse Audit'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-6 bg-red-50 border border-red-300 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(result.scores).map(([category, score]: [string, any]) => (
              <div
                key={category}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-6 text-center shadow-lg"
              >
                <div
                  className={`text-5xl font-bold ${
                    score >= 90
                      ? 'text-green-600'
                      : score >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {score}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}

        {result?.thumbnail && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">Final Screenshot</p>
            <img
              src={result.thumbnail}
              alt="Final screenshot"
              className="mx-auto rounded-lg shadow-2xl max-w-full h-auto border"
            />
          </div>
        )}
      </div>
    </div>
  );
}