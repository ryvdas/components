'use client'

import { useState, useEffect } from 'react'
import { getGamificationStats, getXPForNextLevel } from '../lib/gamification'
import { Sparkles, Award, Flame } from 'lucide-react'

interface GamificationBarProps {
  userId: string
}

export default function GamificationBar({ userId }: GamificationBarProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      const userStats = await getGamificationStats(userId)
      setStats(userStats)
    } catch (error) {
      console.error('Error loading gamification stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-white/20 rounded w-full"></div>
        </div>
      </div>
    )
  }

  const xpForNextLevel = getXPForNextLevel(stats.xp, stats.level)
  const progressPercent = stats.level === 1 
    ? (stats.xp / 100) * 100
    : stats.level === 2
    ? ((stats.xp - 100) / 200) * 100
    : stats.level === 3
    ? ((stats.xp - 300) / 300) * 100
    : ((stats.xp - (600 + (stats.level - 4) * 300)) / 300) * 100

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 shadow-lg text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-bold">Level {stats.level} Learner</h3>
            <p className="text-sm text-purple-100">{stats.xp} XP</p>
          </div>
        </div>
        
        {/* Streak Display */}
        <div className="flex items-center space-x-4">
          {stats.streak.current > 0 && (
            <div className="flex items-center space-x-1 bg-white/20 px-3 py-1.5 rounded-full">
              <Flame className="h-5 w-5 text-orange-300" />
              <span className="font-semibold">{stats.streak.current}</span>
              <span className="text-sm text-purple-100">day streak</span>
            </div>
          )}
          
          {/* Badge Count */}
          <div className="flex items-center space-x-1 bg-white/20 px-3 py-1.5 rounded-full">
            <Award className="h-5 w-5" />
            <span className="font-semibold">
              {Object.values(stats.badges).filter(Boolean).length}
            </span>
            <span className="text-sm text-purple-100">badges</span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="relative w-full bg-white/20 rounded-full h-4 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-sm text-purple-100">
          {xpForNextLevel} XP to level {stats.level + 1}
        </p>
      </div>
    </div>
  )
}

