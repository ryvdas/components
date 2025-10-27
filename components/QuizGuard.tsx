'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Target, BookOpen } from 'lucide-react'

interface QuizGuardProps {
  children: React.ReactNode
}

export default function QuizGuard({ children }: QuizGuardProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Pages that don't require quiz completion
  const excludedPaths = ['/auth', '/quiz']
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          // Check if user has completed the quiz
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setQuizCompleted(!!userData.learningStyle)
          } else {
            setQuizCompleted(false)
          }
        } catch (error) {
          console.error('Error checking quiz status:', error)
          setQuizCompleted(false)
        }
      } else {
        setQuizCompleted(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || isExcludedPath) {
    return <>{children}</>
  }

  if (!quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Complete Your Learning Profile
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Take our quick quiz to discover your learning style and get personalized recommendations
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Personalized Resources</h3>
                <p className="text-sm text-gray-600">Get resources tailored to your learning style</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Better Learning</h3>
                <p className="text-sm text-gray-600">Learn more effectively with your preferred methods</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/quiz')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Take Learning Style Quiz
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Takes only 2-3 minutes to complete
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
