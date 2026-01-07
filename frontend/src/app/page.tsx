'use client';

import { useState } from 'react';
import InputForm from '@/components/input-form';
import MarkdownPreview from '@/components/markdown-preview';
import { generateSpecStream } from '@/services/api';
import { useStreamParser } from '@/hooks/useStreamParser';

export default function Home() {
  const { reasoningContent, markdownContent, parseChunk, reset } = useStreamParser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (description: string) => {
    setIsLoading(true);
    setError('');
    reset();

    await generateSpecStream(
      description,
      parseChunk,
      (err) => {
        setError(err);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Specification Generator
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Describe your feature and let AI generate a standardized PRD for you.
          </p>
        </div>

        <InputForm onSubmit={handleGenerate} isLoading={isLoading} />

        {error && (
          <div className="w-full max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            Error: {error}
          </div>
        )}

        {reasoningContent && (
          <div className="w-full max-w-4xl mx-auto mt-8 border border-amber-200 rounded-lg shadow-sm bg-amber-50 overflow-hidden">
            <div className="px-4 py-2 bg-amber-100 border-b border-amber-200">
              <h2 className="text-sm font-semibold text-amber-800">思考过程</h2>
            </div>
            <div className="p-6 prose prose-amber max-w-none text-sm">
              <pre className="whitespace-pre-wrap font-mono text-amber-900">{reasoningContent}</pre>
            </div>
          </div>
        )}

        <MarkdownPreview content={markdownContent} />
      </div>
    </main>
  );
}
