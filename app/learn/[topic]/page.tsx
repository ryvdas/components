'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getYouTubeVideos, getLearningStyleKeywords } from '../../../lib/youtube'
import { getResourcesByTopic, filterResourcesByStyle, Resource } from '../../../lib/resources'
import ResourceCard from '../../../ResourceCard'
import ProgressTracker from '../../../ProgressTracker'
import { Loader2, Search, Target, BookOpen, Clock, Star, Filter, X } from 'lucide-react'

export default function LearnTopicPage() {
  const params = useParams()
  const topic = params.topic as string
  const [user, setUser] = useState<any>(null)
  const [learningStyle, setLearningStyle] = useState<string>('')
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [staticResources, setStaticResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [learningPlan, setLearningPlan] = useState<any>(null)
  const [planCreated, setPlanCreated] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        // Get user's learning style
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setLearningStyle(userData.learningStyle || 'visual')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (topic && learningStyle) {
      fetchResources()
      checkExistingPlan()
    }
  }, [topic, learningStyle])

  const checkExistingPlan = async () => {
    if (!user) return

    try {
      const plansRef = collection(db, 'users', user.uid, 'learningPlans')
      const q = query(plansRef, where('topic', '==', topic))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const plan = querySnapshot.docs[0].data()
        setLearningPlan(plan)
      }
    } catch (error) {
      console.error('Error checking existing plan:', error)
    }
  }

  const createLearningPlan = async () => {
    if (!user) return

    try {
      const planId = `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const allResources = [
        ...youtubeVideos.map(video => ({
          ...video,
          type: 'video',
          difficulty: 'intermediate'
        })),
        ...staticResources
      ]

      const newPlan = {
        id: planId,
        topic: topic,
        title: `Learn ${topic}`,
        description: `A personalized learning plan for ${topic}`,
        difficulty: 'beginner',
        estimatedHours: Math.ceil(allResources.length * 1.5),
        learningStyle: learningStyle,
        resources: allResources,
        progress: 0,
        createdAt: new Date()
      }

      await setDoc(doc(db, 'users', user.uid, 'learningPlans', planId), newPlan)
      setLearningPlan(newPlan)
      setPlanCreated(true)
    } catch (error) {
      console.error('Error creating learning plan:', error)
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

      // Extract unique tags from all resources
      const allTags = new Set<string>()
      filteredResources.forEach(resource => {
        if (resource.tags) {
          resource.tags.forEach(tag => allTags.add(tag))
        }
      })
      setAvailableTags(Array.from(allTags).sort())
    } catch (err) {
      setError('Failed to fetch resources. Please try again.')
      console.error('Error fetching resources:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchResources}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllTags = () => {
    setSelectedTags([])
  }

  // Filter and prioritize resources based on learning style and tags
  const getPrioritizedResources = () => {
    const allResources = [
      ...youtubeVideos.map(video => ({
        ...video,
        type: 'video',
        difficulty: 'intermediate'
      })),
      ...staticResources
    ]

    let filteredResources = allResources

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filteredResources = allResources.filter(resource => {
        if (!resource.tags) return false
        return selectedTags.some(tag => resource.tags.includes(tag))
      })
    }

    if (!learningStyle) return filteredResources

    // Separate resources by learning style match
    const styleMatched = filteredResources.filter(resource => 
      resource.learningStyle === learningStyle
    )
    const otherResources = filteredResources.filter(resource => 
      resource.learningStyle !== learningStyle
    )

    // Return style-matched resources first, then others
    return [...styleMatched, ...otherResources]
  }

  const allResources = getPrioritizedResources()

  const completedResources = 0 // This would be tracked in Firebase

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Learn <span className="text-primary-600 capitalize">{topic}</span>
            </h1>
            {learningStyle && (
              <p className="text-lg text-gray-600">
                Personalized for <span className="font-semibold capitalize">{learningStyle}</span> learners
              </p>
            )}
          </div>

          {/* Course Options */}
          {user && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Learning Options</h3>
                    <p className="text-gray-600">Choose how you want to learn this topic</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href={`/course/${topic}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start Course
                  </Link>
                  {!learningPlan && !planCreated && (
                    <button
                      onClick={createLearningPlan}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                    >
                      <Target className="h-5 w-5 mr-2" />
                      Create Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan Created Success */}
          {planCreated && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Learning Plan Created!</h3>
                  <p className="text-green-700">Your personalized learning plan has been saved. Access it anytime from your Plans menu.</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Tracker */}
          <ProgressTracker 
            total={allResources.length}
            completed={completedResources}
            topic={topic}
          />

          {/* Learning Style Indicator */}
          {learningStyle && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Resources are prioritized for <span className="capitalize font-semibold">{learningStyle}</span> learners
                </span>
              </div>
            </div>
          )}

          {/* Tag Filter Section */}
          {availableTags.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Filter by Tags</h3>
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <span className="mr-2">Active filters:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources Count */}
          {selectedTags.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {allResources.length} resource{allResources.length !== 1 ? 's' : ''} 
              {selectedTags.length > 0 && ` matching ${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
            </div>
          )}

          {/* Resources Grid */}
          {allResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allResources.map((resource, index) => (
                <div key={resource.id} className="relative">
                  {resource.learningStyle === learningStyle && index < 6 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full z-10 shadow-lg">
                      Perfect Match
                    </div>
                  )}
                  <ResourceCard 
                    resource={resource}
                    learningStyle={learningStyle}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">
                We couldn't find any resources for "{topic}". Try searching for a different topic.
              </p>
            </div>
          )}

          {/* Learning Tips */}
          {learningStyle && (
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Tips for {learningStyle.charAt(0).toUpperCase() + learningStyle.slice(1)} Learners</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {learningStyle === 'visual' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Visual Learning Tips:</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Take notes with diagrams and mind maps</li>
                        <li>• Use color coding to organize information</li>
                        <li>• Watch video tutorials with visual demonstrations</li>
                        <li>• Create flashcards with images</li>
                      </ul>
                    </div>
                  </>
                )}
                {learningStyle === 'auditory' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Auditory Learning Tips:</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Listen to podcasts and audio lectures</li>
                        <li>• Discuss concepts with others</li>
                        <li>• Record yourself explaining topics</li>
                        <li>• Use background music while studying</li>
                      </ul>
                    </div>
                  </>
                )}
                {learningStyle === 'reading' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Reading/Writing Learning Tips:</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Take detailed written notes</li>
                        <li>• Read articles and documentation</li>
                        <li>• Write summaries of what you learn</li>
                        <li>• Use lists and bullet points</li>
                      </ul>
                    </div>
                  </>
                )}
                {learningStyle === 'kinesthetic' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Kinesthetic Learning Tips:</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Try hands-on projects and experiments</li>
                        <li>• Build models and prototypes</li>
                        <li>• Take frequent breaks to move around</li>
                        <li>• Practice with interactive tools</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
