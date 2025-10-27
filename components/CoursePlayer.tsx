'use client'

import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Play, Pause, CheckCircle, Clock, ExternalLink, BookOpen } from 'lucide-react'

interface CoursePlayerProps {
  resource: any
  onComplete?: () => void
  onProgress?: (progress: number) => void
}

export default function CoursePlayer({ resource, onComplete, onProgress }: CoursePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        loadProgress()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadProgress = async () => {
    if (!user) return

    try {
      const progressDoc = await getDoc(doc(db, 'users', user.uid, 'courseProgress', resource.id))
      if (progressDoc.exists()) {
        const data = progressDoc.data()
        setProgress(data.progress || 0)
        setIsCompleted(data.completed || false)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const updateProgress = async (newProgress: number, completed: boolean = false) => {
    if (!user) return

    try {
      await setDoc(doc(db, 'users', user.uid, 'courseProgress', resource.id), {
        resourceId: resource.id,
        progress: newProgress,
        completed,
        lastUpdated: new Date(),
        resourceType: resource.type || 'video'
      }, { merge: true })

      setProgress(newProgress)
      setIsCompleted(completed)
      
      if (onProgress) {
        onProgress(newProgress)
      }
      
      if (completed && onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleVideoProgress = (event: any) => {
    const video = event.target
    if (video.duration) {
      const currentProgress = (video.currentTime / video.duration) * 100
      updateProgress(currentProgress)
    }
  }

  const handleVideoEnd = () => {
    updateProgress(100, true)
  }

  const markAsCompleted = () => {
    updateProgress(100, true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative">
        {resource.type === 'video' && resource.id ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${resource.id}?enablejsapi=1&origin=${window.location.origin}`}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                // YouTube API would be needed for progress tracking
                // For now, we'll use manual completion
              }}
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">External Resource</p>
            </div>
          </div>
        )}

        {/* Progress Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              <span className="text-sm">
                {isCompleted ? 'Completed' : `${Math.round(progress)}% watched`}
              </span>
            </div>
            <div className="w-32 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {resource.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {resource.description}
            </p>
          </div>
          <div className="ml-4">
            {resource.type === 'video' ? (
              <button
                onClick={markAsCompleted}
                disabled={isCompleted}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 inline" />
                    Completed
                  </>
                ) : (
                  'Mark Complete'
                )}
              </button>
            ) : (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Resource
              </a>
            )}
          </div>
        </div>

        {/* Resource Info */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {resource.duration || 'Duration not specified'}
          </div>
          <div className="flex items-center">
            <span className="capitalize">{resource.learningStyle}</span>
          </div>
          <div className="flex items-center">
            <span className="capitalize">{resource.difficulty}</span>
          </div>
        </div>

        {/* Learning Style Indicator */}
        {resource.learningStyle && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Perfect for {resource.learningStyle} learners:</span>{' '}
              {resource.learningStyle === 'visual' && 'Visual diagrams and demonstrations'}
              {resource.learningStyle === 'auditory' && 'Clear explanations and audio content'}
              {resource.learningStyle === 'reading' && 'Detailed text and documentation'}
              {resource.learningStyle === 'kinesthetic' && 'Hands-on practice and interactive content'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
