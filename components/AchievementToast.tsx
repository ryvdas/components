'use client'

import { Award, X } from 'lucide-react'

interface AchievementToastProps {
  badge: {
    id: string
    name: string
    description: string
    icon: string
  }
  onClose: () => void
}

export default function AchievementToast({ badge, onClose }: AchievementToastProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm border-2 border-yellow-400 animate-slide-up z-50">
      <div className="flex items-start space-x-3">
        <div className="text-4xl">{badge.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="h-5 w-5 text-yellow-500" />
            <h4 className="font-bold text-gray-900">Badge Unlocked!</h4>
          </div>
          <h5 className="font-semibold text-gray-800">{badge.name}</h5>
          <p className="text-sm text-gray-600">{badge.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

