'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { BookOpen, Clock, Target, TrendingUp, Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface LearningPlan {
  id: string
  topic: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedHours: number
  learningStyle: string
  resources: any[]
  progress: number
  createdAt: Date
}

export default function LearningPlansPage() {
  const [user, setUser] = useState<any>(null)
  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchLearningPlans(user.uid)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchLearningPlans = async (userId: string) => {
    setLoading(true)
    try {
      const plansRef = collection(db, 'users', userId, 'learningPlans')
      const q = query(plansRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const userPlans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningPlan[]
      
      setPlans(userPlans)
    } catch (error) {
      console.error('Error fetching learning plans:', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const createLearningPlan = async (topic: string) => {
    if (!user) return

    try {
      const planId = `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const newPlan: LearningPlan = {
        id: planId,
        topic: topic,
        title: `Learn ${topic}`,
        description: `A personalized learning plan for ${topic}`,
        difficulty: 'beginner',
        estimatedHours: 10,
        learningStyle: user.learningStyle || 'visual',
        resources: [],
        progress: 0,
        createdAt: new Date()
      }

      await setDoc(doc(db, 'users', user.uid, 'learningPlans', planId), newPlan)
      setPlans(prev => [newPlan, ...prev])
    } catch (error) {
      console.error('Error creating learning plan:', error)
    }
  }

  const filteredPlans = plans.filter(plan =>
    plan.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning plans...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view learning plans</h2>
          <p className="text-gray-600 mb-6">
            Create an account or sign in to access your personalized learning plans.
          </p>
          <Link 
            href="/auth"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Learning Plans</h1>
            <p className="text-lg text-gray-600 mb-6">
              Personalized learning paths tailored to your style and interests
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your learning plans..."
                  className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Quick Create Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Learning Plan</h2>
            <div className="flex flex-wrap gap-3">
              {['JavaScript', 'Python', 'React', 'Machine Learning', 'Design', 'Marketing'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => createLearningPlan(topic)}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Plans Grid */}
          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.title}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        plan.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plan.difficulty}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {plan.estimatedHours} hours estimated
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        {plan.learningStyle} learner
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        {plan.resources.length} resources
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{plan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href={`/course/${plan.topic}`}
                        className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Course
                      </Link>
                      <Link
                        href={`/learn/${plan.topic}`}
                        className="block w-full bg-gray-100 text-gray-700 text-center py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Browse Resources
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No plans found' : 'No learning plans yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try a different search term or create a new learning plan.'
                  : 'Create your first learning plan to get started on your learning journey.'
                }
              </p>
              {!searchQuery && (
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Learning Plan
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
