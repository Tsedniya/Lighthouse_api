'use client';
import { useState } from 'react';

export default function Light() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const runLighthouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

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

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to analyze the URL');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) =>
    score >= 90 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Input Form */}
      <form onSubmit={runLighthouse} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 mb-8">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-5 py-4 text-lg border border-zinc-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 placeholder-gray-400"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-xl transition"
        >
          {loading ? 'Analyzing...' : 'Run Full Lighthouse Audit'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-6 bg-red-50 border border-red-300 text-red-700 rounded-xl">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {Object.entries(result.scores || {}).map(([cat, score]: [string, any]) => (
              <div
                key={cat}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center shadow-lg"
              >
                <div className={`text-6xl font-bold ${getScoreColor(score as number)}`}>
                  {score}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 capitalize">
                  {cat.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Core Web Vitals */}
          {result.metrics && (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-6">Core Web Vitals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {Object.entries(result.metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-sm text-gray-500 uppercase tracking-wider">{key}</div>
                    <div className="text-2xl font-semibold mt-1">{value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Screenshot */}
          {result.thumbnail && (
            <div className="my-12 text-center">
              <p className="text-lg font-semibold mb-4">Final Screenshot</p>
              <img
                src={result.thumbnail}
                alt="Final page screenshot"
                className="mx-auto rounded-lg shadow-2xl max-w-full h-auto border border-gray-200"
              />
            </div>
          )}

          {/* Opportunities & Diagnostics */}
          {result.opportunities && result.opportunities.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-8">Opportunities & Diagnostics</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {result.opportunities.map((opp: any) => (
                  <div
                    key={opp.id}
                    className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition"
                  >
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                      {opp.title}
                    </h3>
                    {opp.displayValue && (
                      <p className="text-orange-600 font-semibold mt-2">{opp.displayValue}</p>
                    )}
                    {opp.details && typeof opp.details === 'string' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{opp.details}</p>
                    )}
                    {Array.isArray(opp.details) && opp.details.length > 0 && (
                      <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                        {opp.details.slice(0, 6).map((item: any, i: number) => (
                          <li key={i}>
                            {typeof item === 'object' && item.url
                              ? item.url
                              : typeof item === 'object'
                              ? JSON.stringify(item)
                              : item}
                          </li>
                        ))}
                        {opp.details.length > 6 && (
                          <li className="text-gray-500 italic">...and {opp.details.length - 6} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No opportunities found */}
          {result.opportunities && result.opportunities.length === 0 && (
            <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                Awesome! No major opportunities found.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}