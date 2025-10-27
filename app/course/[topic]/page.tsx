'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getYouTubeVideos, getLearningStyleKeywords } from '../../../lib/youtube'
import { getResourcesByTopic, filterResourcesByStyle } from '../../../lib/resources'
import CourseLayout from '../../../components/CourseLayout'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CoursePage() {
  const params = useParams()
  const topic = params.topic as string
  const [user, setUser] = useState<any>(null)
  const [learningStyle, setLearningStyle] = useState<string>('')
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [staticResources, setStaticResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchUserLearningStyle()
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (topic) {
      fetchResources()
    }
  }, [topic, learningStyle])

  const fetchUserLearningStyle = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setLearningStyle(userData.learningStyle || '')
      }
    } catch (error) {
      console.error('Error fetching learning style:', error)
    }
  }

  const fetchResources = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch YouTube videos with learning style enhancement
      const videos = await getYouTubeVideos(topic, learningStyle)
      setYoutubeVideos(videos)

      // Get static resources for the topic
      const resources = getResourcesByTopic(topic)
      const filteredResources = filterResourcesByStyle(resources, learningStyle)
      setStaticResources(filteredResources)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setError('Failed to load course resources')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access courses</h2>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading course</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Combine all resources
  const allResources = [
    ...youtubeVideos.map(video => ({
      ...video,
      type: 'video',
      difficulty: 'intermediate'
    })),
    ...staticResources
  ]

  if (allResources.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No course content available</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any resources for "{topic}". Try searching for a different topic.
          </p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/plans"
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learn {topic}</h1>
                <p className="text-gray-600">
                  Personalized course for {learningStyle} learners
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {allResources.length} resources
            </div>
          </div>
        </div>
      </div>

      {/* Course Layout */}
      <CourseLayout topic={topic} resources={allResources} />
    </div>
  )
}
