'use client'

import { useState, useEffect } from 'react'
import { auth } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getGamificationStats, getXPForNextLevel, BADGE_DEFINITIONS, calculateLevel } from '../../lib/gamification'
import { Trophy, Award, Target, Sparkles, Flame, BookOpen, Zap, GraduationCap, CheckCircle, TrendingUp, Clock, Star } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  requirement: string
  earned: boolean
  progress?: number
  total?: number
}

export default function ProgressPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadStats(user.uid)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadStats = async (userId: string) => {
    try {
      const userStats = await getGamificationStats(userId)
      setStats(userStats)
      
      // Define all available badges
      const allBadges: Badge[] = [
        {
          id: 'first_step',
          name: 'First Step',
          description: 'You\'ve started your journey!',
          icon: '🧩',
          requirement: 'Complete first resource',
          earned: userStats?.badges?.first_step || false,
          progress: userStats?.completedResources || 0,
          total: 1
        },
        {
          id: 'streak_starter',
          name: 'Streak Starter',
          description: 'Consistency pays off!',
          icon: '🔥',
          requirement: 'Maintain a 3-day streak',
          earned: userStats?.badges?.streak_starter || false,
          progress: userStats?.streak?.current || 0,
          total: 3
        },
        {
          id: 'focused_learner',
          name: 'Focused Learner',
          description: 'Focused and steady progress',
          icon: '🎯',
          requirement: 'Watch 10 full videos',
          earned: userStats?.badges?.focused_learner || false,
          progress: 0,
          total: 10
        },
        {
          id: 'dedicated_learner',
          name: 'Dedicated Learner',
          description: 'Committed to growth',
          icon: '📚',
          requirement: 'Complete 10 resources',
          earned: userStats?.badges?.dedicated_learner || false,
          progress: userStats?.completedResources || 0,
          total: 10
        },
        {
          id: 'expert',
          name: 'Expert',
          description: 'A true master of learning',
          icon: '🏆',
          requirement: 'Reach 1000 XP',
          earned: userStats?.badges?.expert || false,
          progress: userStats?.xp || 0,
          total: 1000
        },
        {
          id: 'week_warrior',
          name: 'Week Warrior',
          description: '7 days strong!',
          icon: '⚡',
          requirement: 'Maintain a 7-day streak',
          earned: userStats?.badges?.week_warrior || false,
          progress: userStats?.streak?.current || 0,
          total: 7
        },
        {
          id: 'path_completer',
          name: 'Path Completer',
          description: 'You finished a full learning path!',
          icon: '🎓',
          requirement: 'Complete your first learning path',
          earned: userStats?.badges?.path_completer || false,
          progress: userStats?.completedPaths || 0,
          total: 1
        }
      ]
      
      setBadges(allBadges)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const getIconComponent = (icon: string) => {
    const iconMap: Record<string, any> = {
      '🧩': Trophy,
      '🔥': Flame,
      '🎯': Target,
      '📚': BookOpen,
      '🏆': Award,
      '⚡': Zap,
      '🎓': GraduationCap
    }
    return iconMap[icon] || Sparkles
  }

  const getOverallProgressPercent = () => {
    if (!stats) return 0
    
    const totalXP = stats.xp
    const currentLevel = stats.level
    
    // Calculate XP required for current level
    let xpForCurrentLevel = 0
    if (currentLevel === 1) {
      xpForCurrentLevel = totalXP
    } else if (currentLevel === 2) {
      xpForCurrentLevel = totalXP - 100
    } else if (currentLevel === 3) {
      xpForCurrentLevel = totalXP - 300
    } else {
      xpForCurrentLevel = totalXP - (600 + (currentLevel - 4) * 300)
    }
    
    // Total XP needed for level (300 for level 3+, 200 for level 2, 100 for level 1)
    const totalXPNeeded = currentLevel === 1 ? 100 : currentLevel === 2 ? 200 : 300
    
    return Math.min((xpForCurrentLevel / totalXPNeeded) * 100, 100)
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const earnedBadges = badges.filter(b => b.earned)
  const earnedCount = earnedBadges.length
  const xpForNextLevel = getXPForNextLevel(stats.xp, stats.level)
  const levelProgress = getOverallProgressPercent()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Learning Progress</h1>
            <p className="text-lg text-gray-600">
              Track your journey and achievements
            </p>
          </div>

          {/* Main Stats Overview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Level & XP Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Current Level</p>
                  <h2 className="text-3xl font-bold">Level {stats.level}</h2>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Star className="h-8 w-8" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">{stats.xp} XP earned</span>
                  <span className="text-blue-100">{xpForNextLevel} XP to next level</span>
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Current Streak</p>
                  <h2 className="text-3xl font-bold">{stats.streak.current} days</h2>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Flame className="h-8 w-8" />
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-orange-100">Longest: {stats.streak.longest} days</span>
                <span className="text-orange-100">Keep it up! 🔥</span>
              </div>
            </div>
          </div>

          {/* Activity Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resources Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.completedResources}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paths Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.completedPaths}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Badges Earned</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {earnedCount}/{badges.length}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              <span className="text-sm text-gray-600">
                {earnedCount} of {badges.length} badges unlocked
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => {
                const IconComponent = getIconComponent(badge.icon)
                const progressPercent = badge.progress && badge.total 
                  ? Math.min((badge.progress / badge.total) * 100, 100) 
                  : 0

                return (
                  <div
                    key={badge.id}
                    className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300 ${
                      badge.earned
                        ? 'ring-4 ring-green-500 shadow-xl scale-105'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div className="text-center mb-4">
                      <div
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-3 ${
                          badge.earned
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <IconComponent
                          className={`h-10 w-10 ${
                            badge.earned ? 'text-white' : 'text-gray-400'
                          }`}
                        />
                      </div>
                      
                      {/* Emoji */}
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      
                      {badge.earned && (
                        <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          ✓ Earned
                        </div>
                      )}
                    </div>

                    {/* Badge Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{badge.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                      
                      {/* Progress Bar */}
                      {!badge.earned && badge.progress !== undefined && badge.total !== undefined && (
                        <div className="space-y-2 mb-4">
                          <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {badge.progress} / {badge.total}
                          </p>
                        </div>
                      )}
                      
                      <div className={`text-xs px-3 py-1.5 rounded-full inline-block ${
                        badge.earned
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {badge.requirement}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <Sparkles className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Keep Learning!</h2>
                <p className="text-purple-100">
                  Complete resources, maintain your streak, and unlock more achievements
                </p>
              </div>
              <a
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
