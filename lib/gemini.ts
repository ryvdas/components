import axios from 'axios'

export interface LearningPathwayModule {
  title: string
  type: 'Video' | 'Article' | 'Tutorial' | 'Course' | 'Book' | 'Podcast' | 'Interactive' | 'Exercise'
  resource_link: string
  description: string
  estimated_time: string // e.g., "20 minutes", "1 hour"
  estimated_time_minutes: number // For calculations
  style_tag: 'Visual' | 'Auditory' | 'Reading-Writing' | 'Kinesthetic'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  order?: number // For logical progression
}

export interface LearningPathway {
  topic: string
  total_estimated_time: string
  total_estimated_time_minutes: number
  learning_style: 'Visual' | 'Auditory' | 'Reading-Writing' | 'Kinesthetic'
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced'
  modules: LearningPathwayModule[]
}

export interface EducationalResource {
  id: string
  title: string
  url: string
  type: 'article' | 'tutorial' | 'course' | 'book' | 'podcast' | 'interactive'
  estimatedTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  mastery: 'foundational' | 'intermediate' | 'advanced'
  category: string
  features: string[]
  tags: string[]
  prerequisites: string[]
  language: string
  framework: string
  description: string
  source: string
  credibilityScore: number
}

export async function generateEducationalResources(
  topic: string,
  learningStyle: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<EducationalResource[]> {
  try {
    const prompt = `
You are an expert educational content curator. Generate 3-5 high-quality educational resources for learning "${topic}" that would be perfect for a ${difficulty} learner with a ${learningStyle} learning style.

For each resource, provide:
1. A realistic, credible URL from a well-known educational platform
2. Accurate title and description
3. Appropriate difficulty and time estimates
4. Relevant tags and features

Use these platforms as sources:
- Articles: Medium, Dev.to, freeCodeCamp, MDN Web Docs, Wikipedia, Khan Academy
- Tutorials: freeCodeCamp, Codecademy, W3Schools, TutorialsPoint, GeeksforGeeks
- Courses: Coursera, edX, Udemy, Khan Academy, MIT OpenCourseWare
- Books: O'Reilly, Packt, Manning Publications, free online books
- Interactive: CodePen, JSFiddle, Repl.it, GitHub repositories
- Documentation: Official docs, MDN, React docs, Vue docs, etc.

Format as JSON array with these exact fields:
[
  {
    "title": "Resource Title",
    "url": "https://real-platform.com/path",
    "type": "article|tutorial|course|book|podcast|interactive",
    "estimatedTime": 45,
    "difficulty": "beginner|intermediate|advanced",
    "mastery": "foundational|intermediate|advanced",
    "category": "tutorial|guide|course|practice|reference",
    "features": ["feature1", "feature2"],
    "tags": ["tag1", "tag2", "tag3"],
    "prerequisites": ["prereq1"],
    "language": "English",
    "framework": "framework-name",
    "description": "Brief description of what this resource teaches",
    "source": "Platform Name",
    "credibilityScore": 0.9
  }
]

Make sure URLs are real and accessible. Focus on free or widely available resources.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    const generatedText = response.data.candidates[0].content.parts[0].text
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    
    if (jsonMatch) {
      const resources = JSON.parse(jsonMatch[0])
      // Add unique IDs to each resource
      return resources.map((resource: any, index: number) => ({
        ...resource,
        id: `real-${topic.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`
      }))
    } else {
      console.error('Failed to parse Gemini response:', generatedText)
      return []
    }
  } catch (error) {
    console.error('Error generating educational resources:', error)
    return []
  }
}

export interface VideoRecommendation {
  searchQuery: string
  reasoning: string
  expectedDuration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  learningStyle: string
  keyTopics: string[]
}

export interface VideoAnalysis {
  id: string
  title: string
  description: string
  duration: number
  channelTitle: string
  publishedAt: string
  thumbnail: string
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  categoryId: string
  contentAnalysis: {
    mainTopics: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    learningStyle: string[]
    keyConcepts: string[]
    quizSegments: Array<{
      startTime: number
      endTime: number
      topic: string
      difficulty: 'easy' | 'medium' | 'hard'
    }>
    credibilityScore: number
    educationalValue: number
  }
}

export async function generateVideoRecommendations(
  topic: string,
  learningStyle: string,
  timeFrame: number, // in hours
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<VideoRecommendation[]> {
  try {
    const prompt = `
You are an expert educational content curator. Generate 5-8 specific YouTube search queries for learning "${topic}" that would be perfect for a ${userLevel} learner with a ${learningStyle} learning style.

Requirements:
- Total learning time should be approximately ${timeFrame} hours
- Focus on ${learningStyle} learning preferences
- Include a mix of beginner, intermediate, and advanced content
- Prioritize credible educational channels
- Consider the learning progression from basic to advanced concepts

For each recommendation, provide:
1. Specific search query (be very specific)
2. Reasoning for why this video would be valuable
3. Expected duration in minutes
4. Difficulty level (beginner/intermediate/advanced)
5. Key topics covered
6. Learning style compatibility

Format as JSON array with these fields: searchQuery, reasoning, expectedDuration, difficulty, learningStyle, keyTopics

Example format:
[
  {
    "searchQuery": "JavaScript fundamentals complete tutorial for beginners",
    "reasoning": "Comprehensive introduction covering all basics needed to start",
    "expectedDuration": 120,
    "difficulty": "beginner",
    "learningStyle": "visual",
    "keyTopics": ["variables", "functions", "loops", "DOM manipulation"]
  }
]
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    const generatedText = response.data.candidates[0].content.parts[0].text
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    } else {
      console.error('Failed to parse Gemini response:', generatedText)
      return []
    }
  } catch (error) {
    console.error('Error generating video recommendations:', error)
    return []
  }
}

export async function analyzeVideoContent(videoId: string): Promise<VideoAnalysis | null> {
  try {
    // Get detailed video information from YouTube API
    const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        id: videoId,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
        part: 'snippet,statistics,contentDetails'
      }
    })

    if (!videoResponse.data.items.length) {
      return null
    }

    const video = videoResponse.data.items[0]
    const snippet = video.snippet
    const statistics = video.statistics
    const contentDetails = video.contentDetails

    // Parse duration (ISO 8601 format)
    const duration = parseDuration(contentDetails.duration)

    // Use Gemini to analyze video content
    const contentAnalysis = await analyzeVideoWithGemini({
      title: snippet.title,
      description: snippet.description,
      tags: snippet.tags || [],
      duration: duration,
      channelTitle: snippet.channelTitle
    })

    return {
      id: videoId,
      title: snippet.title,
      description: snippet.description,
      duration: duration,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      thumbnail: snippet.thumbnails.medium.url,
      viewCount: parseInt(statistics.viewCount || '0'),
      likeCount: parseInt(statistics.likeCount || '0'),
      commentCount: parseInt(statistics.commentCount || '0'),
      tags: snippet.tags || [],
      categoryId: snippet.categoryId,
      contentAnalysis
    }
  } catch (error) {
    console.error('Error analyzing video content:', error)
    return null
  }
}

async function analyzeVideoWithGemini(videoData: {
  title: string,
  description: string,
  tags: string[],
  duration: number,
  channelTitle: string
}): Promise<VideoAnalysis['contentAnalysis']> {
  try {
    const prompt = `
Analyze this YouTube video for educational content:

Title: ${videoData.title}
Description: ${videoData.description.substring(0, 1000)}...
Tags: ${videoData.tags.join(', ')}
Channel: ${videoData.channelTitle}
Duration: ${Math.floor(videoData.duration / 60)} minutes

Provide analysis in JSON format:
{
  "mainTopics": ["topic1", "topic2"],
  "difficulty": "beginner|intermediate|advanced",
  "learningStyle": ["visual", "auditory", "reading", "kinesthetic"],
  "keyConcepts": ["concept1", "concept2"],
  "quizSegments": [
    {
      "startTime": 120,
      "endTime": 300,
      "topic": "specific topic",
      "difficulty": "easy|medium|hard"
    }
  ],
  "credibilityScore": 0.85,
  "educationalValue": 0.90
}

Focus on:
- Educational value and accuracy
- Learning progression and structure
- Potential quiz segments (identify key learning moments)
- Credibility based on channel and content quality
- Difficulty assessment
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    const generatedText = response.data.candidates[0].content.parts[0].text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    } else {
      // Fallback analysis
      return {
        mainTopics: [videoData.title.split(' ')[0]],
        difficulty: 'intermediate',
        learningStyle: ['visual'],
        keyConcepts: [],
        quizSegments: [],
        credibilityScore: 0.7,
        educationalValue: 0.7
      }
    }
  } catch (error) {
    console.error('Error analyzing video with Gemini:', error)
    return {
      mainTopics: [videoData.title.split(' ')[0]],
      difficulty: 'intermediate',
      learningStyle: ['visual'],
      keyConcepts: [],
      quizSegments: [],
      credibilityScore: 0.7,
      educationalValue: 0.7
    }
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

export async function getDetailedYouTubeVideos(
  searchQuery: string,
  maxResults: number = 5
): Promise<VideoAnalysis[]> {
  try {
    // First, search for videos
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        q: searchQuery,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
        part: 'snippet',
        maxResults: maxResults,
        type: 'video',
        order: 'relevance'
      }
    })

    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId)
    
    // Analyze each video
    const videoAnalyses = await Promise.all(
      videoIds.map(async (videoId: string) => {
        return await analyzeVideoContent(videoId)
      })
    )

    // Filter out null results and sort by educational value
    return videoAnalyses
      .filter((analysis): analysis is VideoAnalysis => analysis !== null)
      .sort((a, b) => b.contentAnalysis.educationalValue - a.contentAnalysis.educationalValue)
  } catch (error) {
    console.error('Error getting detailed YouTube videos:', error)
    return []
  }
}

/**
 * Generate a comprehensive learning pathway using Gemini AI
 * This function creates a structured learning plan with real, accessible resources
 */
export async function generateLearningPathway(
  topic: string,
  learningStyle: 'Visual' | 'Auditory' | 'Reading-Writing' | 'Kinesthetic',
  timeForCompletion: number, // in hours
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced'
): Promise<LearningPathway> {
  try {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables')
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')))
      throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.')
    }
    
    if (apiKey.length < 20) {
      console.warn('API key seems too short. Length:', apiKey.length)
    }
    
    console.log('Using Gemini API key (length:', apiKey.length, ')')

    // Convert learning style to match expected format
    const learningStyleFormatted = learningStyle === 'Reading-Writing' ? 'Reading-Writing' : learningStyle
    
    // Create comprehensive prompt
    const prompt = `
You are an expert educational content curator specializing in creating personalized learning pathways. Your task is to create a structured, comprehensive learning pathway using freely available online materials.

**User Requirements:**
- Topic: "${topic}"
- Learning Style: ${learningStyleFormatted}
- Time for Completion: ${timeForCompletion} hours total
- Experience Level: ${experienceLevel}

**Your Task:**
Create a structured learning pathway that follows these guidelines:

1. **Resource Selection Criteria:**
   - Prioritize HIGH-QUALITY, CREDIBLE resources from reputable platforms
   - Ensure all resource links are REAL, ACCESSIBLE, and CURRENT (not broken or outdated)
   - Focus on FREE or widely accessible materials
   - Balance different resource types based on learning style:
     * Visual → Prefer videos, interactive tutorials, diagrams, infographics, visual demonstrations
     * Auditory → Prefer podcasts, lectures, video explainers, audio courses, discussion-based content
     * Reading-Writing → Prefer articles, blog posts, documentation, textbooks, written tutorials
     * Kinesthetic → Prefer interactive projects, coding challenges, hands-on exercises, simulations, practice tools

2. **Pathway Structure:**
   - Divide the pathway into logical MODULES or STEPS
   - Order modules from foundational → intermediate → advanced concepts
   - Ensure smooth learning progression (each module builds on previous ones)
   - Include a mix of resource types when appropriate
   - Ensure TOTAL estimated time ≈ ${timeForCompletion} hours (±10% tolerance)

3. **Module Requirements:**
   Each module MUST include:
   - **Title**: Clear, descriptive title (3-8 words)
   - **Type**: One of: Video, Article, Tutorial, Course, Book, Podcast, Interactive, Exercise
   - **Resource Link**: REAL, WORKING URL (use actual URLs from these platforms):
     * Videos: YouTube (youtube.com/watch?v=...), Vimeo, Khan Academy
     * Articles: Medium, Dev.to, freeCodeCamp, MDN Web Docs, Wikipedia, Khan Academy articles
     * Tutorials: freeCodeCamp, Codecademy, W3Schools, TutorialsPoint, GeeksforGeeks, official docs
     * Courses: Coursera (free courses), edX (audit mode), Khan Academy, MIT OpenCourseWare
     * Books: O'Reilly free books, Packt free samples, free online textbooks
     * Interactive: CodePen, JSFiddle, Repl.it, GitHub repositories with live demos
     * Podcasts: Spotify, Apple Podcasts, Google Podcasts (with direct links)
   - **Description**: 1-2 sentences explaining what this resource teaches and why it's valuable
   - **Estimated Time**: Realistic time (e.g., "20 minutes", "1 hour", "2 hours")
   - **Style Tag**: Must match the learning style: ${learningStyleFormatted}
   - **Difficulty**: beginner, intermediate, or advanced (should align with experience level and progression)

4. **Quality Standards:**
   - Verify links are from CREDIBLE sources (avoid spam, low-quality content)
   - Ensure resources are ACTUALLY FREE or accessible (no paywalls for core content)
   - Resources should be RECENT (prefer content from last 3-5 years, unless foundational)
   - Match difficulty progression: start with ${experienceLevel} level, gradually increase complexity
   - Ensure total time is approximately ${timeForCompletion} hours

5. **Output Format:**
   You MUST respond with ONLY valid JSON in this exact format:
   {
     "topic": "${topic}",
     "total_estimated_time": "${timeForCompletion} hours",
     "total_estimated_time_minutes": ${timeForCompletion * 60},
     "learning_style": "${learningStyleFormatted}",
     "experience_level": "${experienceLevel}",
     "modules": [
       {
         "title": "Module Title Here",
         "type": "Video",
         "resource_link": "https://www.youtube.com/watch?v=...",
         "description": "Clear description of what this teaches.",
         "estimated_time": "20 minutes",
         "estimated_time_minutes": 20,
         "style_tag": "${learningStyleFormatted}",
         "difficulty": "beginner",
         "order": 1
       }
     ]
   }

**CRITICAL REQUIREMENTS:**
- ALL resource links MUST be REAL and VERIFIABLE URLs
- Do NOT make up URLs or use placeholder links
- Ensure estimated_time_minutes is a number (convert hours to minutes: 1 hour = 60 minutes)
- Total estimated_time_minutes should sum to approximately ${timeForCompletion * 60} minutes
- Order modules sequentially (order: 1, 2, 3, etc.)
- Style_tag must be exactly: "${learningStyleFormatted}"
- Include at least 4-8 modules to create a comprehensive pathway
- Balance foundational concepts with practical application

**Example of good resource links:**
- YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- Khan Academy: https://www.khanacademy.org/computing/computer-programming/programming
- freeCodeCamp: https://www.freecodecamp.org/news/...
- Medium: https://medium.com/@author/...
- MDN: https://developer.mozilla.org/en-US/docs/...
- GitHub: https://github.com/user/repo

**IMPORTANT:** Only return the JSON object. Do not include any markdown formatting, code blocks, or additional text before or after the JSON.
`;

    // First, try to list available models to see what's actually available
    let availableModels: string[] = []
    try {
      console.log('Fetching list of available Gemini models...')
      const listModelsResponse = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      if (listModelsResponse.data && listModelsResponse.data.models) {
        availableModels = listModelsResponse.data.models
          .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
          .map((model: any) => model.name.replace('models/', ''))
        console.log('✅ Available Gemini models:', availableModels)
      }
    } catch (err: any) {
      console.warn('⚠️ Could not list available models, will try common ones:', err.response?.status || err.message)
    }

    // Build list of model endpoints to try - prioritize models from ListModels if available
    const modelEndpoints: string[] = []
    
    // If we got available models, use those first
    if (availableModels.length > 0) {
      console.log(`Using ${availableModels.length} models from ListModels API`)
      for (const modelName of availableModels) {
        modelEndpoints.push(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
        )
      }
    }
    
    // Also try common model names that might work (in case ListModels failed but models exist)
    const commonModels = [
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
    ]
    
    for (const modelName of commonModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      if (!modelEndpoints.includes(endpoint)) {
        modelEndpoints.push(endpoint)
      }
    }
    
    // Add v1 API versions as fallback
    for (const modelName of commonModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
      if (!modelEndpoints.includes(endpoint)) {
        modelEndpoints.push(endpoint)
      }
    }
    
    let response: any = null
    let lastError: any = null
    const errorDetails: string[] = []
    
    // Try each endpoint until one works
    for (const endpoint of modelEndpoints) {
      try {
        const endpointDisplay = endpoint.replace(apiKey, 'API_KEY_HIDDEN')
        console.log('Trying Gemini API endpoint:', endpointDisplay)
        
        response = await axios.post(
          endpoint,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.4,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            validateStatus: () => true // Don't throw on any status code
          }
        )
        
        // Check if request was successful
        if (response.status === 200 && response.data && response.data.candidates && response.data.candidates.length > 0) {
          console.log('✅ Successfully connected to Gemini API using:', endpointDisplay)
          break
        } else {
          // Log the response for debugging
          const status = response.status
          const errorMsg = response.data?.error?.message || JSON.stringify(response.data).substring(0, 200)
          console.warn(`❌ Unexpected response from ${endpointDisplay}:`, {
            status,
            error: errorMsg
          })
          errorDetails.push(`${endpointDisplay}: Status ${status} - ${errorMsg}`)
          lastError = new Error(`API returned status ${status}: ${errorMsg}`)
          response = null
          continue
        }
      } catch (err: any) {
        lastError = err
        const status = err.response?.status || 'unknown'
        const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown error'
        const endpointDisplay = endpoint.replace(apiKey, 'API_KEY_HIDDEN')
        console.log(`❌ Endpoint failed (${status}):`, endpointDisplay, '-', errorMsg)
        errorDetails.push(`${endpointDisplay}: ${status} - ${errorMsg}`)
        
        // Log full error for non-404 errors (they might have useful info)
        if (status !== 404 && err.response?.data) {
          console.error('Full error response:', JSON.stringify(err.response.data, null, 2))
        }
        continue
      }
    }
    
    // If all endpoints failed, throw detailed error
    if (!response || !response.data || !response.data.candidates) {
      const errorMessage = `All Gemini API endpoints failed. Errors:\n${errorDetails.join('\n')}\n\n` +
        `Troubleshooting:\n` +
        `1. Verify your API key is correct: Check NEXT_PUBLIC_GEMINI_API_KEY in .env.local\n` +
        `2. Enable the API: Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com and enable "Generative Language API"\n` +
        `3. Check API key permissions: Ensure it has access to the Generative Language API\n` +
        `4. Restart dev server: After adding/changing .env.local, restart with: npm run dev`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    const generatedText = response.data.candidates[0].content.parts[0].text.trim()
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = generatedText
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const pathway: LearningPathway = JSON.parse(jsonText)
    
    // Validate and normalize the pathway
    pathway.modules = pathway.modules.map((module, index) => ({
      ...module,
      order: module.order || index + 1,
      estimated_time_minutes: module.estimated_time_minutes || parseTimeToMinutes(module.estimated_time),
      difficulty: module.difficulty || (experienceLevel.toLowerCase() as 'beginner' | 'intermediate' | 'advanced'),
      style_tag: module.style_tag || learningStyleFormatted
    }))
    
    // Sort modules by order
    pathway.modules.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    // Calculate total time
    const totalMinutes = pathway.modules.reduce((sum, module) => sum + module.estimated_time_minutes, 0)
    pathway.total_estimated_time_minutes = totalMinutes
    pathway.total_estimated_time = `${Math.round(totalMinutes / 60 * 10) / 10} hours`
    
    return pathway
  } catch (error: any) {
    console.error('Error generating learning pathway:', error)
    
    // Provide more detailed error messages
    if (error.response) {
      // API responded with error
      const status = error.response.status
      const statusText = error.response.statusText
      const data = error.response.data
      
      if (status === 404) {
        throw new Error(`Gemini API endpoint not found (404). This might indicate an incorrect API endpoint or model name. Please check your API configuration.`)
      } else if (status === 400) {
        throw new Error(`Bad request (400): ${data?.error?.message || statusText}. Please check your API key and request format.`)
      } else if (status === 401) {
        throw new Error(`Unauthorized (401): Invalid API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local`)
      } else if (status === 403) {
        throw new Error(`Forbidden (403): API key may not have access to this endpoint or quota exceeded.`)
      } else {
        throw new Error(`API error (${status}): ${data?.error?.message || statusText}`)
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error(`No response from Gemini API. Please check your internet connection and API key.`)
    } else {
      // Error setting up request
      throw new Error(`Failed to generate learning pathway: ${error.message || 'Unknown error'}`)
    }
  }
}

/**
 * Helper function to parse time strings like "20 minutes", "1 hour" to minutes
 */
function parseTimeToMinutes(timeString: string): number {
  const normalized = timeString.toLowerCase().trim()
  
  // Match patterns like "20 minutes", "1 hour", "1.5 hours", etc.
  const hourMatch = normalized.match(/(\d+\.?\d*)\s*hours?/)
  const minuteMatch = normalized.match(/(\d+\.?\d*)\s*minutes?/)
  
  let minutes = 0
  
  if (hourMatch) {
    minutes += parseFloat(hourMatch[1]) * 60
  }
  
  if (minuteMatch) {
    minutes += parseFloat(minuteMatch[1])
  }
  
  // Default to 30 minutes if parsing fails
  return minutes || 30
}

/**
 * Convert LearningPathway modules to EducationalResource format for compatibility
 */
export function pathwayModulesToResources(
  pathway: LearningPathway,
  baseTopic: string
): EducationalResource[] {
  return pathway.modules.map((module, index) => ({
    id: `pathway-${baseTopic.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
    title: module.title,
    url: module.resource_link,
    type: module.type.toLowerCase() as 'article' | 'tutorial' | 'course' | 'book' | 'podcast' | 'interactive',
    estimatedTime: module.estimated_time_minutes,
    difficulty: module.difficulty || 'beginner',
    mastery: module.difficulty === 'beginner' ? 'foundational' : 
             module.difficulty === 'intermediate' ? 'intermediate' : 'advanced',
    category: module.type === 'Video' ? 'tutorial' : 
              module.type === 'Interactive' || module.type === 'Exercise' ? 'practice' : 'guide',
    features: module.type === 'Interactive' || module.type === 'Exercise' ? ['interactive', 'hands-on'] : 
              module.type === 'Video' ? ['visual', 'step-by-step'] : ['comprehensive'],
    tags: [baseTopic.toLowerCase(), pathway.learning_style.toLowerCase(), module.difficulty || 'beginner', 'ai-generated'],
    prerequisites: [],
    language: 'English',
    framework: baseTopic.toLowerCase(),
    description: module.description,
    source: extractSourceFromUrl(module.resource_link),
    credibilityScore: 0.85 // Default high credibility for curated resources
  }))
}

/**
 * Extract source/platform name from URL
 */
function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '')
    
    // Map common domains to readable names
    const sourceMap: Record<string, string> = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'khanacademy.org': 'Khan Academy',
      'freecodecamp.org': 'freeCodeCamp',
      'medium.com': 'Medium',
      'dev.to': 'Dev.to',
      'mdn.org': 'MDN Web Docs',
      'developer.mozilla.org': 'MDN Web Docs',
      'github.com': 'GitHub',
      'w3schools.com': 'W3Schools',
      'coursera.org': 'Coursera',
      'edx.org': 'edX',
      'udemy.com': 'Udemy',
      'codecademy.com': 'Codecademy',
      'repl.it': 'Repl.it',
      'codepen.io': 'CodePen',
      'jsfiddle.net': 'JSFiddle'
    }
    
    return sourceMap[hostname] || hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return 'Unknown'
  }
}
