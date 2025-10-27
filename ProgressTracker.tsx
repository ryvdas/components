'use client';

import { CheckCircle, Circle, BookOpen } from 'lucide-react';

interface ProgressTrackerProps {
  total: number;
  completed: number;
  topic: string;
}

export default function ProgressTracker({ total, completed, topic }: ProgressTrackerProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
            <p className="text-sm text-gray-600">Topic: {topic}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{completed}/{total}</p>
          <p className="text-sm text-gray-600">resources completed</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-600">{completed} completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <Circle className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">{total - completed} remaining</span>
        </div>
      </div>

      {percentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium text-sm">
            🎉 Congratulations! You've completed all resources for this topic!
          </p>
        </div>
      )}
    </div>
  );
}
