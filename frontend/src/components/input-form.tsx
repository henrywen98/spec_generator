'use client';

import { useState } from 'react';

interface InputFormProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }
    setError('');
    onSubmit(description);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          Feature Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your feature... (e.g., A login page with email and password)"
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isLoading || !description.trim()}
        className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
          isLoading || !description.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Generating...' : 'Generate Specification'}
      </button>
    </form>
  );
}
