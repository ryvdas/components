export interface Resource {
  id: string
  title: string
  description: string
  url: string
  type: 'video' | 'article' | 'course' | 'tutorial' | 'project' | 'documentation' | 'interactive'
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  thumbnail?: string
  category: 'tutorial' | 'project' | 'reference' | 'practice' | 'theory' | 'hands-on'
  mastery: 'introduction' | 'foundational' | 'intermediate-level' | 'advanced-level' | 'expert'
  tags: string[]
  prerequisites?: string[]
  outcomes?: string[]
  estimatedTime: number // in minutes
  isProjectBased: boolean
  isInteractive: boolean
  hasExercises: boolean
  language?: string
  framework?: string
  skillLevel: 'newbie' | 'novice' | 'intermediate' | 'advanced' | 'expert'
}

// Enhanced sample resources with comprehensive metadata
export const sampleResources: Resource[] = [
  {
    id: '1',
    title: 'Complete JavaScript Tutorial for Beginners',
    description: 'A comprehensive guide to JavaScript fundamentals with interactive examples and hands-on coding exercises',
    url: 'https://javascript.info',
    type: 'course',
    learningStyle: 'reading',
    difficulty: 'beginner',
    duration: '20 hours',
    thumbnail: '/api/placeholder/300/200',
    category: 'tutorial',
    mastery: 'foundational',
    tags: ['javascript', 'fundamentals', 'syntax', 'variables', 'functions'],
    prerequisites: ['basic HTML', 'CSS knowledge'],
    outcomes: ['Understand JavaScript syntax', 'Write basic functions', 'Handle DOM manipulation'],
    estimatedTime: 1200,
    isProjectBased: false,
    isInteractive: true,
    hasExercises: true,
    language: 'JavaScript',
    skillLevel: 'novice'
  },
  {
    id: '2',
    title: 'React Visual Learning Guide',
    description: 'Learn React through interactive diagrams, component trees, and visual examples with step-by-step illustrations',
    url: 'https://reactjs.org/tutorial/tutorial.html',
    type: 'course',
    learningStyle: 'visual',
    difficulty: 'intermediate',
    duration: '15 hours',
    thumbnail: '/api/placeholder/300/200',
    category: 'tutorial',
    mastery: 'intermediate-level',
    tags: ['react', 'components', 'jsx', 'state', 'props', 'hooks'],
    prerequisites: ['JavaScript ES6', 'HTML/CSS', 'Node.js basics'],
    outcomes: ['Build React components', 'Manage component state', 'Use React hooks'],
    estimatedTime: 900,
    isProjectBased: true,
    isInteractive: true,
    hasExercises: true,
    language: 'JavaScript',
    framework: 'React',
    skillLevel: 'intermediate'
  },
  {
    id: '3',
    title: 'Python Hands-On Project Series',
    description: 'Build real-world projects while learning Python programming - web scraping, data analysis, and automation',
    url: 'https://realpython.com',
    type: 'project',
    learningStyle: 'kinesthetic',
    difficulty: 'beginner',
    duration: '25 hours',
    thumbnail: '/api/placeholder/300/200',
    category: 'project',
    mastery: 'foundational',
    tags: ['python', 'projects', 'web-scraping', 'data-analysis', 'automation'],
    prerequisites: ['basic programming concepts'],
    outcomes: ['Build Python applications', 'Use Python libraries', 'Create automation scripts'],
    estimatedTime: 1500,
    isProjectBased: true,
    isInteractive: true,
    hasExercises: true,
    language: 'Python',
    skillLevel: 'novice'
  },
  {
    id: '4',
    title: 'Machine Learning Audio Lectures',
    description: 'Listen to expert explanations of ML concepts with detailed audio explanations and case studies',
    url: 'https://course.fast.ai',
    type: 'course',
    learningStyle: 'auditory',
    difficulty: 'intermediate',
    duration: '30 hours',
    thumbnail: '/api/placeholder/300/200',
    category: 'theory',
    mastery: 'intermediate-level',
    tags: ['machine-learning', 'ai', 'algorithms', 'statistics', 'data-science'],
    prerequisites: ['Python programming', 'Linear algebra', 'Statistics basics'],
    outcomes: ['Understand ML algorithms', 'Apply ML techniques', 'Evaluate model performance'],
    estimatedTime: 1800,
    isProjectBased: false,
    isInteractive: false,
    hasExercises: true,
    language: 'Python',
    framework: 'TensorFlow',
    skillLevel: 'intermediate'
  }
]

export function filterResourcesByStyle(resources: Resource[], style: string): Resource[] {
  return resources.filter(resource => resource.learningStyle === style)
}

export function getResourcesByTopic(topic: string): Resource[] {
  // Enhanced topic-specific resource mapping with comprehensive metadata
  const topicResources: Record<string, Resource[]> = {
    'javascript': [
      {
        id: 'js-1',
        title: 'JavaScript Fundamentals Course',
        description: 'Complete beginner guide to JavaScript programming with interactive coding exercises',
        url: 'https://javascript.info',
        type: 'course',
        learningStyle: 'reading',
        difficulty: 'beginner',
        duration: '20 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'tutorial',
        mastery: 'foundational',
        tags: ['javascript', 'fundamentals', 'syntax', 'es6', 'dom'],
        prerequisites: ['HTML basics', 'CSS basics'],
        outcomes: ['Master JavaScript syntax', 'Understand ES6 features', 'Build interactive web pages'],
        estimatedTime: 1200,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: true,
        language: 'JavaScript',
        skillLevel: 'novice'
      },
      {
        id: 'js-2',
        title: 'Interactive JavaScript Tutorial',
        description: 'Hands-on JavaScript learning with live coding environment and real-time feedback',
        url: 'https://learnjavascript.online',
        type: 'interactive',
        learningStyle: 'kinesthetic',
        difficulty: 'beginner',
        duration: '15 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'hands-on',
        mastery: 'foundational',
        tags: ['javascript', 'interactive', 'coding', 'practice', 'exercises'],
        prerequisites: ['basic programming concepts'],
        outcomes: ['Code JavaScript confidently', 'Debug JavaScript programs', 'Use modern JavaScript features'],
        estimatedTime: 900,
        isProjectBased: false,
        isInteractive: true,
        hasExercises: true,
        language: 'JavaScript',
        skillLevel: 'novice'
      },
      {
        id: 'js-3',
        title: 'JavaScript Project: Build a Todo App',
        description: 'Create a complete todo application using vanilla JavaScript, HTML, and CSS',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        type: 'project',
        learningStyle: 'kinesthetic',
        difficulty: 'intermediate',
        duration: '8 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'project',
        mastery: 'intermediate-level',
        tags: ['javascript', 'project', 'todo-app', 'dom', 'local-storage'],
        prerequisites: ['JavaScript basics', 'HTML/CSS'],
        outcomes: ['Build a complete web application', 'Use local storage', 'Implement CRUD operations'],
        estimatedTime: 480,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: false,
        language: 'JavaScript',
        skillLevel: 'intermediate'
      }
    ],
    'python': [
      {
        id: 'py-1',
        title: 'Python for Beginners',
        description: 'Learn Python programming from scratch with comprehensive examples and exercises',
        url: 'https://python.org/tutorial',
        type: 'course',
        learningStyle: 'reading',
        difficulty: 'beginner',
        duration: '25 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'tutorial',
        mastery: 'foundational',
        tags: ['python', 'programming', 'basics', 'syntax', 'data-types'],
        prerequisites: ['basic computer skills'],
        outcomes: ['Write Python programs', 'Use Python data structures', 'Handle file operations'],
        estimatedTime: 1500,
        isProjectBased: false,
        isInteractive: true,
        hasExercises: true,
        language: 'Python',
        skillLevel: 'novice'
      },
      {
        id: 'py-2',
        title: 'Python Visual Learning Guide',
        description: 'Python concepts explained with diagrams, flowcharts, and visual representations',
        url: 'https://realpython.com',
        type: 'course',
        learningStyle: 'visual',
        difficulty: 'intermediate',
        duration: '18 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'tutorial',
        mastery: 'intermediate-level',
        tags: ['python', 'visual', 'diagrams', 'algorithms', 'data-structures'],
        prerequisites: ['Python basics', 'programming concepts'],
        outcomes: ['Understand Python internals', 'Visualize algorithms', 'Optimize Python code'],
        estimatedTime: 1080,
        isProjectBased: false,
        isInteractive: true,
        hasExercises: true,
        language: 'Python',
        skillLevel: 'intermediate'
      },
      {
        id: 'py-3',
        title: 'Python Web Scraping Project',
        description: 'Build a web scraper to collect data from websites using BeautifulSoup and requests',
        url: 'https://scrapy.org',
        type: 'project',
        learningStyle: 'kinesthetic',
        difficulty: 'intermediate',
        duration: '12 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'project',
        mastery: 'intermediate-level',
        tags: ['python', 'web-scraping', 'beautifulsoup', 'requests', 'data-collection'],
        prerequisites: ['Python basics', 'HTML knowledge'],
        outcomes: ['Scrape web data', 'Parse HTML/XML', 'Handle dynamic content'],
        estimatedTime: 720,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: false,
        language: 'Python',
        framework: 'BeautifulSoup',
        skillLevel: 'intermediate'
      }
    ],
    'react': [
      {
        id: 'react-1',
        title: 'React Official Tutorial',
        description: 'Learn React with interactive examples and step-by-step guided tutorials',
        url: 'https://reactjs.org/tutorial',
        type: 'tutorial',
        learningStyle: 'kinesthetic',
        difficulty: 'intermediate',
        duration: '12 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'tutorial',
        mastery: 'intermediate-level',
        tags: ['react', 'components', 'jsx', 'state', 'props'],
        prerequisites: ['JavaScript ES6', 'HTML/CSS', 'Node.js'],
        outcomes: ['Build React components', 'Manage component state', 'Use React lifecycle methods'],
        estimatedTime: 720,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: true,
        language: 'JavaScript',
        framework: 'React',
        skillLevel: 'intermediate'
      },
      {
        id: 'react-2',
        title: 'React Visual Guide',
        description: 'React concepts with visual explanations, component trees, and data flow diagrams',
        url: 'https://react.dev',
        type: 'course',
        learningStyle: 'visual',
        difficulty: 'intermediate',
        duration: '16 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'tutorial',
        mastery: 'intermediate-level',
        tags: ['react', 'visual', 'components', 'hooks', 'context'],
        prerequisites: ['JavaScript ES6', 'React basics'],
        outcomes: ['Visualize React concepts', 'Use React hooks', 'Implement context API'],
        estimatedTime: 960,
        isProjectBased: false,
        isInteractive: true,
        hasExercises: true,
        language: 'JavaScript',
        framework: 'React',
        skillLevel: 'intermediate'
      },
      {
        id: 'react-3',
        title: 'Build a React E-commerce App',
        description: 'Create a complete e-commerce application with React, including cart, checkout, and user authentication',
        url: 'https://github.com/facebook/react',
        type: 'project',
        learningStyle: 'kinesthetic',
        difficulty: 'advanced',
        duration: '20 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'project',
        mastery: 'advanced-level',
        tags: ['react', 'e-commerce', 'authentication', 'state-management', 'api-integration'],
        prerequisites: ['React intermediate', 'Node.js', 'Database basics'],
        outcomes: ['Build complex React apps', 'Implement authentication', 'Integrate with APIs'],
        estimatedTime: 1200,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: false,
        language: 'JavaScript',
        framework: 'React',
        skillLevel: 'advanced'
      }
    ],
    'machine learning': [
      {
        id: 'ml-1',
        title: 'ML Fundamentals',
        description: 'Introduction to machine learning concepts with mathematical foundations and practical examples',
        url: 'https://course.fast.ai',
        type: 'course',
        learningStyle: 'reading',
        difficulty: 'intermediate',
        duration: '30 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'theory',
        mastery: 'intermediate-level',
        tags: ['machine-learning', 'algorithms', 'statistics', 'linear-algebra', 'python'],
        prerequisites: ['Python programming', 'Linear algebra', 'Statistics'],
        outcomes: ['Understand ML algorithms', 'Implement ML models', 'Evaluate model performance'],
        estimatedTime: 1800,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: true,
        language: 'Python',
        framework: 'TensorFlow',
        skillLevel: 'intermediate'
      },
      {
        id: 'ml-2',
        title: 'ML Audio Lectures',
        description: 'Listen to ML concepts explained by experts with detailed audio explanations and case studies',
        url: 'https://www.coursera.org/learn/machine-learning',
        type: 'course',
        learningStyle: 'auditory',
        difficulty: 'intermediate',
        duration: '40 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'theory',
        mastery: 'intermediate-level',
        tags: ['machine-learning', 'audio', 'lectures', 'algorithms', 'statistics'],
        prerequisites: ['Python basics', 'Mathematics', 'Statistics'],
        outcomes: ['Understand ML theory', 'Apply ML algorithms', 'Interpret ML results'],
        estimatedTime: 2400,
        isProjectBased: false,
        isInteractive: false,
        hasExercises: true,
        language: 'Python',
        framework: 'Scikit-learn',
        skillLevel: 'intermediate'
      },
      {
        id: 'ml-3',
        title: 'ML Project: Image Classification',
        description: 'Build an image classification model using TensorFlow and Keras with real-world datasets',
        url: 'https://tensorflow.org',
        type: 'project',
        learningStyle: 'kinesthetic',
        difficulty: 'advanced',
        duration: '15 hours',
        thumbnail: '/api/placeholder/300/200',
        category: 'project',
        mastery: 'advanced-level',
        tags: ['machine-learning', 'deep-learning', 'tensorflow', 'keras', 'image-classification'],
        prerequisites: ['Python intermediate', 'ML basics', 'TensorFlow basics'],
        outcomes: ['Build deep learning models', 'Use TensorFlow/Keras', 'Deploy ML models'],
        estimatedTime: 900,
        isProjectBased: true,
        isInteractive: true,
        hasExercises: false,
        language: 'Python',
        framework: 'TensorFlow',
        skillLevel: 'advanced'
      }
    ]
  }

  const topicKey = topic.toLowerCase()
  const specificResources = topicResources[topicKey] || []
  
  // Also include general resources that match the topic
  const generalResources = sampleResources.filter(resource => 
    resource.title.toLowerCase().includes(topic.toLowerCase()) ||
    resource.description.toLowerCase().includes(topic.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(topic.toLowerCase()))
  )

  return [...specificResources, ...generalResources]
}