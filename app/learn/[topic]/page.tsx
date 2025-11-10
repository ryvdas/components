'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { generateVideoRecommendations, getDetailedYouTubeVideos, VideoAnalysis, generateEducationalResources, generateLearningPathway, pathwayModulesToResources } from '../../../lib/gemini'
import { getYouTubeVideos } from '../../../lib/youtube'
import { getResourcesByTopic, filterResourcesByStyle, Resource } from '../../../lib/resources'
import ResourceCard from '../../../ResourceCard'
import ProgressTracker from '../../../ProgressTracker'
import CourseLayout from '../../../components/CourseLayout'
import { Loader2, Search, Target, BookOpen, Clock, Star, Filter, X, Plus, Sparkles, Wand2, Upload } from 'lucide-react'
import { addXP } from '../../../lib/gamification'

export default function LearnTopicPage() {
  const params = useParams()
  let rawTopic = params.topic as string
  
  // Decode URL parameter (handles %20 and other encoded characters)
  rawTopic = decodeURIComponent(rawTopic || '')
  
  // Convert URL parameter back to readable format (handles both hyphens and spaces)
  const getDisplayTopic = (urlTopic: string) => {
    // First decode any URL encoding
    const decoded = decodeURIComponent(urlTopic || '')
    // Replace hyphens with spaces, then normalize
    return decoded
      .replace(/-/g, ' ')
      .replace(/%20/g, ' ')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()
  }
  
  const displayTopic = getDisplayTopic(rawTopic)
  
  // Normalize topic for duplicate checking (standardize format)
  const normalizeTopic = (topicName: string): string => {
    return topicName
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const normalizedTopic = normalizeTopic(displayTopic)
  
  // Convert display topic to URL format (for navigation)
  const getTopicUrl = (topicName: string): string => {
    return topicName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-')
  }
  
  const topicUrl = getTopicUrl(displayTopic)
  const router = useRouter()
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
  const [showAddResourceModal, setShowAddResourceModal] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showCourseInterface, setShowCourseInterface] = useState(false)
  const [courseResources, setCourseResources] = useState<any[]>([])

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
        // Award 1 XP for opening a learning pathway (only once per mount)
        if (typeof window !== 'undefined' && !(window as any).__learnmatch_opened_pathway) {
          (window as any).__learnmatch_opened_pathway = true;
          addXP(user.uid, 1, 'Opened learning pathway')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (displayTopic && learningStyle) {
      fetchResources()
      checkExistingPlan()
    }
  }, [displayTopic, learningStyle])

  const checkExistingPlan = async () => {
    if (!user || !displayTopic) return

    try {
      // Get all plans and check if any normalized topic matches
      const plansRef = collection(db, 'users', user.uid, 'learningPlans')
      const querySnapshot = await getDocs(plansRef)
      
      // Check if any plan has a normalized topic that matches
      const existingPlan = querySnapshot.docs.find(doc => {
        const planData = doc.data()
        const planTopic = planData.topic || planData.normalizedTopic || ''
        return normalizeTopic(planTopic) === normalizedTopic
      })
      
      if (existingPlan) {
        const plan = existingPlan.data()
        setLearningPlan(plan)
      }
    } catch (error) {
      console.error('Error checking existing plan:', error)
    }
  }

  const createLearningPlan = async () => {
    if (!user) return

    try {
      // If no resources loaded yet, fetch them first
      if ((youtubeVideos.length === 0 && staticResources.length === 0) && displayTopic) {
        await fetchResources()
        // Wait a bit for resources to populate
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Normalize topic for consistent storage
      const normalizedTopicForStorage = normalizedTopic
      
      // Check if a plan with this normalized topic already exists
      const plansRef = collection(db, 'users', user.uid, 'learningPlans')
      const querySnapshot = await getDocs(plansRef)
      const existingPlan = querySnapshot.docs.find(doc => {
        const planData = doc.data()
        const planTopic = planData.topic || ''
        return normalizeTopic(planTopic) === normalizedTopicForStorage
      })
      
      if (existingPlan) {
        setError('A learning plan for this topic already exists.')
        setLearningPlan(existingPlan.data())
        return
      }
      
      const planId = `${normalizedTopicForStorage.replace(/\s+/g, '-')}-${Date.now()}`
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
        topic: displayTopic, // Store the display format for readability
        normalizedTopic: normalizedTopicForStorage, // Store normalized version for duplicate checking
        title: `Learn ${displayTopic}`,
        description: `A personalized learning plan for ${displayTopic}`,
        difficulty: 'beginner',
        estimatedHours: Math.ceil(Math.max(allResources.length * 1.5, 5)), // At least 5 hours
        learningStyle: learningStyle || 'visual',
        resources: allResources,
        progress: 0,
        createdAt: new Date()
      }

      await setDoc(doc(db, 'users', user.uid, 'learningPlans', planId), newPlan)
      setLearningPlan(newPlan)
      setPlanCreated(true)
    } catch (error) {
      console.error('Error creating learning plan:', error)
      setError('Failed to create learning plan. Please try again.')
    }
  }

  const fetchResources = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Validate inputs
      if (!displayTopic) {
        throw new Error('Topic is not available')
      }

      if (!learningStyle) {
        console.warn('Learning style not set, using default: visual')
      }

      // Fetch YouTube videos with learning style enhancement (with error handling)
      let videos: any[] = []
      try {
        videos = await getYouTubeVideos(displayTopic, learningStyle || 'visual')
        setYoutubeVideos(videos)
      } catch (videoError) {
        console.error('Error fetching YouTube videos:', videoError)
        // Continue with static resources even if YouTube fails
        setYoutubeVideos([])
      }

      // Get static resources for the topic (use displayTopic for better matching)
      const resources = getResourcesByTopic(displayTopic.toLowerCase())
      const filteredResources = filterResourcesByStyle(resources, learningStyle || 'visual')
      setStaticResources(filteredResources)

      // Extract unique tags from all resources
      const allTags = new Set<string>()
      filteredResources.forEach((resource: Resource) => {
        if (resource.tags) {
          resource.tags.forEach((tag: string) => allTags.add(tag))
        }
      })
      videos.forEach((video: any) => {
        if (video.tags) {
          video.tags.forEach((tag: string) => allTags.add(tag))
        }
      })
      setAvailableTags(Array.from(allTags).sort())

      // If we have at least some resources, clear any previous errors
      if (filteredResources.length > 0 || videos.length > 0) {
        setError('')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch resources. Please try again.'
      setError(errorMessage)
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

  const generateAIPath = async () => {
    if (!user) return
    
    setIsGeneratingAI(true)
    try {
      console.log(`Generating AI path for ${displayTopic} with ${learningStyle} learning style`)
      
      // Generate real educational resources (with error handling)
      let realResources: any[] = []
      try {
        realResources = await generateEducationalResources(
          displayTopic,
          learningStyle || 'visual',
          'beginner'
        )
        console.log(`Generated ${realResources.length} real educational resources`)
      } catch (geminiError) {
        console.error('Error generating educational resources from Gemini:', geminiError)
        // Continue with YouTube videos even if Gemini fails
        realResources = []
      }
      
      // Fetch YouTube videos (with error handling)
      let enhancedVideos: any[] = []
      try {
        enhancedVideos = await getYouTubeVideos(`${displayTopic} ${learningStyle || 'visual'} tutorial course`, learningStyle || 'visual')
      } catch (videoError) {
        console.error('Error fetching YouTube videos:', videoError)
        // If both fail, show error
        if (realResources.length === 0) {
          setError('Failed to generate resources. Please check your API keys and try again.')
          return
        }
      }
      
      // Add more comprehensive resources
      const aiResources = [
        ...enhancedVideos.map(video => ({
          ...video,
          type: 'video',
          estimatedTime: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
          difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          mastery: ['foundational', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          category: 'tutorial',
          features: ['interactive', 'step-by-step'],
          tags: [displayTopic.toLowerCase(), learningStyle || 'visual', 'ai-generated'],
          prerequisites: [],
          language: 'English',
          framework: displayTopic.toLowerCase()
        })),
        ...realResources
      ]

      // Update resources
      setYoutubeVideos(enhancedVideos)
      setStaticResources(aiResources)
      
      // Update available tags
      const newTags = Array.from(new Set(aiResources.flatMap((r: any) => r.tags || [])))
      setAvailableTags(newTags)
      
      // Navigate to course page after successful generation
      if (aiResources.length > 0 || enhancedVideos.length > 0) {
        // Wait a moment for state to update, then navigate
        setTimeout(() => {
          router.push(`/course/${topicUrl}`)
        }, 500)
      }
      
    } catch (error) {
      console.error('Error generating AI path:', error)
      setError('Failed to generate AI learning path. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleAddResource = () => {
    setShowAddResourceModal(true)
  }

  // Start course with perfect matches
  const startCourseWithPerfectMatches = async () => {
    if (!user) return
    
    try {
      setIsGeneratingAI(true)
      
      // Get all available resources
      const allResourcesTemp = [
        ...youtubeVideos.map(video => ({
          ...video,
          type: 'video',
          difficulty: 'intermediate',
          mastery: 'foundational',
          category: 'tutorial'
        })),
        ...staticResources
      ]

      if (allResourcesTemp.length === 0) {
        setError('No resources found for this topic.')
        setIsGeneratingAI(false)
        return
      }

      // Filter for perfect matches only
      const perfectMatches = allResourcesTemp.filter(resource => calculateMatchScore(resource) === 'perfect')
      
      // If we have perfect matches, use them; otherwise, use all resources sorted
      const resourcesToUse = perfectMatches.length > 0 
        ? perfectMatches.slice(0, 10)
        : allResourcesTemp.slice(0, 6)

      // Sort by difficulty and mastery
      const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 }
      const masteryOrder = { 'introduction': 0, 'foundational': 1, 'intermediate-level': 2, 'advanced-level': 3, 'expert': 4 }
      
      const sortedResources = resourcesToUse.sort((a, b) => {
        const diffA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 999
        const diffB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 999
        if (diffA !== diffB) return diffA - diffB

        const masteryA = masteryOrder[a.mastery as keyof typeof masteryOrder] ?? 999
        const masteryB = masteryOrder[b.mastery as keyof typeof masteryOrder] ?? 999
        return masteryA - masteryB
      })

      // Save all resources to saved menu
      for (const resource of sortedResources) {
        const savedRef = doc(db, 'users', user.uid, 'savedResources', resource.id)
        await setDoc(savedRef, {
          ...resource,
          savedAt: new Date(),
          learningStyle,
        }, { merge: true })
      }

      // Create learning plan
      const normalizedTopicForStorage = normalizedTopic
      const planId = `${normalizedTopicForStorage.replace(/\s+/g, '-')}-${Date.now()}`
      
      const totalMinutes = sortedResources.reduce((sum, r) => sum + (r.estimatedTime || 0), 0)
      const estimatedHours = Math.ceil(totalMinutes / 60)
      
      const newPlan = {
        id: planId,
        topic: displayTopic,
        normalizedTopic: normalizedTopicForStorage,
        title: `Learn ${displayTopic}`,
        description: `A personalized learning plan for ${displayTopic}`,
        difficulty: 'beginner',
        estimatedHours: estimatedHours,
        learningStyle: learningStyle || 'visual',
        resources: sortedResources,
        progress: 0,
        createdAt: new Date()
      }

      await setDoc(doc(db, 'users', user.uid, 'learningPlans', planId), newPlan)
      
      // Set course resources and show interface
      setCourseResources(sortedResources)
      setShowCourseInterface(true)
      setLearningPlan(newPlan)
      
    } catch (error) {
      console.error('Error starting course:', error)
      setError(`Failed to start course: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Calculate match score for a resource based on learning style
  const calculateMatchScore = (resource: any): 'perfect' | 'slight' | 'low' => {
    if (!learningStyle || !resource.learningStyle) return 'low'
    
    // Perfect match: exact learning style match AND both hands-on/project category AND isProjectBased AND isInteractive
    // This makes perfect matches very selective (~3 out of 9 resources)
    if (resource.learningStyle === learningStyle) {
      const isHandsOnOrProject = resource.category === 'hands-on' || resource.category === 'project'
      const isHighlyInteractive = resource.isProjectBased && resource.isInteractive
      
      if (isHandsOnOrProject && isHighlyInteractive) {
        return 'perfect'
      }
      // Otherwise it's a slight match even if learning style matches
      return 'slight'
    }
    
    // Slight match: compatible learning styles OR any resource that matches learning style but doesn't meet perfect criteria
    const learningStyleCompatibility: Record<string, string[]> = {
      'visual': ['reading', 'auditory'], // Visual learners might also appreciate reading and auditory
      'auditory': ['kinesthetic', 'reading'], // Auditory learners can benefit from hands-on and reading
      'reading': ['visual', 'kinesthetic', 'auditory'], // Reading learners might also like visual, hands-on, or auditory
      'kinesthetic': ['visual', 'auditory', 'reading'] // Kinesthetic learners can benefit from visual demonstrations, audio, or reading
    }
    
    const compatibleStyles = learningStyleCompatibility[learningStyle] || []
    if (compatibleStyles.includes(resource.learningStyle)) {
      return 'slight'
    }
    
    // Low match: any resource that doesn't match the above criteria
    return 'low'
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
    const perfectMatches = filteredResources.filter(resource => 
      calculateMatchScore(resource) === 'perfect'
    )
    const slightMatches = filteredResources.filter(resource => 
      calculateMatchScore(resource) === 'slight'
    )
    const lowMatches = filteredResources.filter(resource => 
      calculateMatchScore(resource) === 'low'
    )

    // Return perfect matches first, then slight matches, then low matches
    return [...perfectMatches, ...slightMatches, ...lowMatches]
  }

  const allResources = getPrioritizedResources()

  const completedResources = 0 // This would be tracked in Firebase

  // If course interface is active, show course layout
  if (showCourseInterface && courseResources.length > 0) {
    return <CourseLayout topic={displayTopic} resources={courseResources} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Learn <span className="text-primary-600">{displayTopic}</span>
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
                  <button
                    onClick={startCourseWithPerfectMatches}
                    disabled={isGeneratingAI}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Starting Course...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-5 w-5 mr-2" />
                        Start Course
                      </>
                    )}
                  </button>
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
                  <p className="text-green-600 text-sm mt-1">✨ Add more resources below to customize your plan!</p>
                </div>
              </div>
            </div>
          )}

          {/* Update Message */}
          {learningPlan && !planCreated && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Learning plan active:</span> Access your plan from the Plans menu.
                </p>
              </div>
            </div>
          )}

          {/* Progress Tracker */}
          <ProgressTracker 
            total={allResources.length}
            completed={completedResources}
            topic={displayTopic}
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
              {allResources.map((resource, index) => {
                const matchScore = calculateMatchScore(resource)
                return (
                  <div key={resource.id} className="relative">
                    {matchScore === 'perfect' && (
                      <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-full z-30 shadow-xl border-2 border-green-700">
                        ✓ Perfect Match
                      </div>
                    )}
                    {matchScore === 'slight' && index < 18 && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-4 py-2 rounded-full z-30 shadow-xl border-2 border-yellow-600">
                        ~ Good Match
                      </div>
                    )}
                    {matchScore === 'low' && index < 24 && (
                      <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-bold px-4 py-2 rounded-full z-30 shadow-xl border-2 border-gray-600">
                        · Explore
                      </div>
                    )}
                    <ResourceCard 
                      resource={resource}
                      learningStyle={learningStyle}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No resources found for "{displayTopic}"</h3>
                <p className="text-gray-600 mb-8">
                  We couldn't find any resources for this topic yet. Don't worry - you can create your own learning path!
                </p>
                
                {/* Action Options */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* AI Generated Path */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Generated Path</h4>
                      <p className="text-gray-600 mb-4 text-sm">
                        Let our AI create a personalized learning path tailored to your learning style
                      </p>
                      <button
                        onClick={generateAIPath}
                        disabled={isGeneratingAI}
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                      >
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-5 w-5 mr-2" />
                            Generate AI Path
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Manual Resource Addition */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Add Your Own Resources</h4>
                      <p className="text-gray-600 mb-4 text-sm">
                        Manually add resources you've found or create custom learning materials
                      </p>
                      <button
                        onClick={handleAddResource}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Add Resources
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Help */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="text-left">
                      <h5 className="font-medium text-blue-900 mb-1">Need help getting started?</h5>
                      <p className="text-blue-700 text-sm">
                        Try searching for a more specific topic or check out our{' '}
                        <Link href="/dashboard" className="underline hover:text-blue-800">
                          dashboard
                        </Link>{' '}
                        for popular learning paths.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Resource Modal */}
          {showAddResourceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Resource</h3>
                  <button
                    onClick={() => setShowAddResourceModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter resource title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://freecodecamp.org/article/example"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="course">Course</option>
                      <option value="book">Book</option>
                      <option value="podcast">Podcast</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddResourceModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement resource addition logic
                      setShowAddResourceModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Resource
                  </button>
                </div>
              </div>
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
