import axios from 'axios'

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
}

export async function getYouTubeVideos(query: string, learningStyle?: string): Promise<YouTubeVideo[]> {
  try {
    // Enhance query based on learning style
    let enhancedQuery = query
    if (learningStyle) {
      const styleKeywords = getLearningStyleKeywords(learningStyle)
      const randomKeyword = styleKeywords[Math.floor(Math.random() * styleKeywords.length)]
      enhancedQuery = `${query} ${randomKeyword}`
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        q: enhancedQuery,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
        part: 'snippet',
        maxResults: 15,
        type: 'video',
        order: 'relevance'
      }
    })

    return response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      learningStyle: learningStyle || 'visual' // Default to visual if no style specified
    }))
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return []
  }
}

export function getLearningStyleKeywords(style: string): string[] {
  const keywords = {
    visual: ['visual', 'diagram', 'chart', 'infographic', 'tutorial', 'step by step'],
    auditory: ['audio', 'podcast', 'lecture', 'explanation', 'discussion'],
    reading: ['article', 'text', 'written', 'guide', 'documentation'],
    kinesthetic: ['hands-on', 'practical', 'exercise', 'interactive', 'project']
  }
  
  return keywords[style as keyof typeof keywords] || []
}
