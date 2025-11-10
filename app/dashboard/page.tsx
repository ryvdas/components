'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  Target, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Award, 
  PlayCircle,
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  Circle,
  Edit,
  Save,
  X
} from 'lucide-react'
import GamificationBar from '../../components/GamificationBar'
import AchievementToast from '../../components/AchievementToast'
import { getGamificationStats, BADGE_DEFINITIONS } from '../../lib/gamification'

interface LearningPlan {
  id: string
  topic: string
  createdAt: any
  resources: any[]
  completedResources: string[]
}

interface UserData {
  learningStyle: string
  timeCommitment?: string
  hoursPerWeek?: number
  createdAt: any
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [gamificationStats, setGamificationStats] = useState<any>(null)
  const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null)
  const [isEditingTimeCommitment, setIsEditingTimeCommitment] = useState(false)
  const [editingHoursPerWeek, setEditingHoursPerWeek] = useState<number>(10)
  const [editingTimeCommitment, setEditingTimeCommitment] = useState<string>('moderate')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await fetchUserData(user.uid)
        await fetchLearningPlans(user.uid)
        await loadGamificationStats(user.uid)
      } else {
        router.push('/auth')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])
  
  const loadGamificationStats = async (userId: string) => {
    try {
      const stats = await getGamificationStats(userId)
      setGamificationStats(stats)
    } catch (error) {
      console.error('Error loading gamification stats:', error)
    }
  }

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        setUserData(data)
        // Initialize editing state with current values
        setEditingHoursPerWeek(data.hoursPerWeek || 10)
        setEditingTimeCommitment(data.timeCommitment || 'moderate')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleTimeCommitmentUpdate = async () => {
    if (!user) return
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        hoursPerWeek: editingHoursPerWeek,
        timeCommitment: editingTimeCommitment,
        updatedAt: new Date()
      }, { merge: true })
      
      // Update local state
      setUserData(prev => ({
        ...prev!,
        hoursPerWeek: editingHoursPerWeek,
        timeCommitment: editingTimeCommitment
      }))
      
      setIsEditingTimeCommitment(false)
      
      // Stay on the dashboard (no navigation needed)
    } catch (error) {
      console.error('Error updating time commitment:', error)
    }
  }

  const fetchLearningPlans = async (userId: string) => {
    try {
      const plansQuery = query(
        collection(db, 'users', userId, 'learningPlans'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const plansSnapshot = await getDocs(plansQuery)
      const plans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningPlan[]
      setLearningPlans(plans)
    } catch (error) {
      console.error('Error fetching learning plans:', error)
    }
  }

  const getLearningStyleColor = (style: string) => {
    const colors = {
      visual: 'bg-blue-100 text-blue-800',
      auditory: 'bg-green-100 text-green-800',
      reading: 'bg-purple-100 text-purple-800',
      kinesthetic: 'bg-orange-100 text-orange-800'
    }
    return colors[style as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getProgressPercentage = (plan: LearningPlan) => {
    if (!plan.resources || plan.resources.length === 0) return 0
    return Math.round((plan.completedResources?.length || 0) / plan.resources.length * 100)
  }

  const getTimeCommitmentText = (commitment?: string) => {
    if (!commitment) return 'Not set'
    const commitments = {
      'casual': 'Casual (1-3 hours/week)',
      'moderate': 'Moderate (4-7 hours/week)',
      'intensive': 'Intensive (8+ hours/week)'
    }
    return commitments[commitment as keyof typeof commitments] || commitment
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your learning progress and manage your goals</p>
        </div>
        
        {/* Gamification Bar */}
        {user && (
          <div className="mb-8">
            <GamificationBar userId={user.uid} />
            <div className="mt-4 text-center">
              <Link
                href="/badges"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                View Full Progress & Achievements
              </Link>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900">{learningPlans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Resources</p>
                <p className="text-2xl font-bold text-gray-900">
                  {learningPlans.reduce((total, plan) => total + (plan.completedResources?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Commitment</p>
                <p className="text-lg font-bold text-gray-900">{getTimeCommitmentText(userData?.timeCommitment)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Learning Style</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{userData?.learningStyle || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Learning Style</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getLearningStyleColor(userData?.learningStyle || '')}`}>
                      {userData?.learningStyle ? `${userData.learningStyle.charAt(0).toUpperCase() + userData.learningStyle.slice(1)} Learner` : 'Not set'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Time Commitment</label>
                    {!isEditingTimeCommitment && (
                      <button
                        onClick={() => setIsEditingTimeCommitment(true)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {isEditingTimeCommitment ? (
                    <div className="space-y-3">
                      <select
                        value={editingTimeCommitment}
                        onChange={(e) => setEditingTimeCommitment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                      >
                        <option value="casual">Casual (1-3 hours/week)</option>
                        <option value="moderate">Moderate (4-7 hours/week)</option>
                        <option value="intensive">Intensive (8+ hours/week)</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleTimeCommitmentUpdate}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTimeCommitment(false)
                            setEditingHoursPerWeek(userData?.hoursPerWeek || 10)
                            setEditingTimeCommitment(userData?.timeCommitment || 'moderate')
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{getTimeCommitmentText(userData?.timeCommitment)}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Hours per Week</label>
                  {isEditingTimeCommitment ? (
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={editingHoursPerWeek}
                      onChange={(e) => setEditingHoursPerWeek(parseInt(e.target.value) || 10)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{userData?.hoursPerWeek || 'Not set'} hours</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Link
                    href="/quiz?edit=true"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Update Learning Style
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link
                  href="/plans"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">View All Plans</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/saved"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Saved Resources</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Start New Learning</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Learning Plans */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Learning Plans</h2>
                <Link
                  href="/plans"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              {learningPlans.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No learning plans yet</h3>
                  <p className="text-gray-600 mb-4">Start your learning journey by creating your first plan</p>
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Learning Plan
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {learningPlans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{plan.topic}</h3>
                        <span className="text-sm text-gray-500">
                          {plan.resources?.length || 0} resources
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{getProgressPercentage(plan)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(plan)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {plan.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently created'}
                        </div>
                        <Link
                          href={`/learn/${encodeURIComponent(plan.topic)}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Continue Learning
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
