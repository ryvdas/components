# LearnMatch - Technical Documentation

## Overview

LearnMatch is a modern, intelligent learning platform that curates personalized educational resources based on individual learning styles. Built with Next.js 14 and powered by Firebase, Google Gemini AI, and YouTube API, it helps users discover and organize learning materials tailored to their preferences.

---

## Tech Stack

### Frontend Framework
- **Next.js 14.0.4** - React-based framework with App Router
  - Server-side rendering and static generation
  - API routes for serverless functions
  - File-based routing system
  - Automatic code splitting

### Core Technologies
- **React 18** - UI library with hooks
- **TypeScript 5** - Static typing for code quality
- **Tailwind CSS 3.3** - Utility-first styling
- **Lucide React** - Icon library

### Backend & Database
- **Firebase** (v12.4.0)
  - **Firestore** - NoSQL database for user data and learning plans
  - **Firebase Authentication** - User authentication (Email/Password & Google OAuth)
  - **Real-time Database** - Live updates for user sessions

### AI & External APIs
- **Google Gemini API** (v1beta) - AI-powered content curation and learning pathway generation
- **YouTube Data API v3** - Video search and content analysis

### Development Tools
- **ESLint** - Code linting
- **PostCSS & Autoprefixer** - CSS processing
- **Babel** - JavaScript transpilation for compatibility

---

## Architecture & Implementation

### Application Structure

```
/components (root)
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication page
│   ├── course/[topic]/    # Individual course view
│   ├── dashboard/         # User dashboard
│   ├── learn/[topic]/     # Topic resource browsing
│   ├── plans/             # Learning plans management
│   ├── quiz/              # Learning style quiz
│   └── saved/             # Saved resources
├── components/             # Reusable UI components
│   ├── CourseLayout.tsx   # Course sidebar layout
│   ├── CoursePlayer.tsx   # Video/content player
│   ├── QuizGuard.tsx      # Route protection middleware
│   └── UserDropdown.tsx   # User menu component
├── lib/                    # Core functionality libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── gemini.ts          # AI pathway generation
│   ├── resources.ts       # Static resource database
│   └── youtube.ts         # YouTube API integration
└── Root components         # Shared components (Navbar, etc.)
```

### Key Features & Implementation

#### 1. Personalized Learning Style Assessment

**Implementation:**
- **File:** `components/QuizForm.tsx`
- **Firebase Collection:** `users/{userId}`

**How it works:**
1. Users take an interactive quiz upon signup
2. Questions assess preferences across 4 learning styles:
   - **Visual** - Prefers images, diagrams, videos
   - **Auditory** - Prefers listening, discussions
   - **Reading/Writing** - Prefers text, notes, articles
   - **Kinesthetic** - Prefers hands-on, interactive
3. Time commitment assessment (hours per week)
4. Results stored in Firestore user profile
5. **QuizGuard** component enforces completion before accessing main features

**Technical Details:**
```typescript
interface UserProfile {
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
  hoursPerWeek: number
  timeCommitment: string
  completedQuiz: boolean
}
```

#### 2. AI-Powered Learning Pathway Generation

**Implementation:**
- **File:** `lib/gemini.ts` - `generateLearningPathway()`
- **Model:** Google Gemini (with automatic fallback across model versions)

**How it works:**
1. User requests AI-generated course for a topic
2. System calls Gemini API with comprehensive prompt including:
   - Topic and learning style
   - Time commitment (hours)
   - Experience level
3. Gemini generates structured pathway with:
   - Module titles and descriptions
   - Resource links from reputable platforms
   - Time estimates per module
   - Difficulty progression
   - Style-specific content prioritization
4. Response parsed and converted to app format
5. Stored in Firestore as complete learning plan

**Technical Details:**
- Uses `ListModels` API to find available Gemini models
- Fallback system tries multiple model versions
- Temperature: 0.4 for consistent results
- Max tokens: 4096 for comprehensive pathways
- Automatic time normalization and module ordering

#### 3. Smart Resource Curation

**Implementation:**
- **Files:** `lib/youtube.ts`, `lib/resources.ts`
- **API Integration:** YouTube Data API v3

**How it works:**

**YouTube Videos:**
1. Searches YouTube using learning style keywords
2. Filters by relevance and educational value
3. Analyzes content with Gemini AI for:
   - Main topics covered
   - Difficulty assessment
   - Educational value score
   - Credibility rating
   - Quiz segment identification (for future features)
4. Ranks videos by quality metrics

**Static Resources:**
1. Curated database of high-quality educational platforms
2. Resources include:
   - Articles (Medium, Dev.to, freeCodeCamp, MDN)
   - Tutorials (freeCodeCamp, Codecademy, W3Schools)
   - Courses (Coursera, edX, Khan Academy)
   - Interactive tools (CodePen, Repl.it, GitHub)
3. Filtered by learning style compatibility
4. Tagged with metadata for easy filtering

#### 4. Learning Plan Management

**Implementation:**
- **Files:** `app/course/[topic]/page.tsx`, `app/plans/page.tsx`
- **Firebase Collection:** `users/{userId}/learningPlans`

**How it works:**
1. Users can create plans via:
   - AI generation (Gemini-powered)
   - Manual resource addition
   - Browse and save existing resources
2. Plans include:
   - Topic and normalized identifier
   - Resource list with metadata
   - Progress tracking
   - Estimated completion time
   - Learning style alignment
3. Plans can be:
   - Started and tracked
   - Deleted
   - Shared across devices (via Firebase sync)

**Technical Details:**
```typescript
interface LearningPlan {
  id: string
  topic: string
  normalizedTopic: string  // For duplicate detection
  title: string
  description: string
  difficulty: string
  estimatedHours: number
  learningStyle: string
  resources: EducationalResource[]
  progress: number
  createdAt: Date
  pathway?: LearningPathway  // Full pathway data for AI-generated plans
}
```

#### 5. Course Player & Progress Tracking

**Implementation:**
- **Files:** `components/CoursePlayer.tsx`, `components/CourseLayout.tsx`

**How it works:**
1. Sidebar navigation shows all course modules
2. Main player displays current resource
3. For videos: Embedded YouTube player
4. For articles: External link with "Mark as Complete" button
5. Progress automatically saves to Firestore
6. Visual indicators show completed vs remaining items

#### 6. Search & Discovery

**Implementation:**
- **Files:** `app/learn/[topic]/page.tsx`, `components/SearchBar.tsx`

**How it works:**
1. Global search bar on homepage
2. Topic entered is:
   - URL-normalized (spaces → hyphens)
   - Display-formatted (hyphens → readable text)
   - Normalized for duplicate checking
3. Results page shows:
   - Learning style-matched resources first
   - Tag filtering system
   - Resource cards with full metadata
   - AI generation option if no results
4. Resources can be:
   - Saved individually
   - Added to existing plans
   - Used to create new plans

**Technical Details:**
- URL handling uses `getDisplayTopic()` for readability
- `normalizeTopic()` ensures consistent duplicate detection
- Tag system enables multi-dimensional filtering
- Resource prioritization by learning style match

#### 7. User Authentication & Management

**Implementation:**
- **Files:** `app/auth/page.tsx`, `components/UserDropdown.tsx`
- **Firebase Auth:** Email/Password, Google OAuth

**How it works:**
1. Users can sign in with:
   - Email and password
   - Google OAuth (one-click)
2. User dropdown provides access to:
   - Dashboard
   - Learning Plans
   - Saved Resources
   - Account Settings
   - Quiz editing
   - Sign out
3. Session persists across browser sessions
4. Protected routes use `QuizGuard`

#### 8. Dashboard & Analytics

**Implementation:**
- **File:** `app/dashboard/page.tsx`

**How it works:**
1. Overview shows:
   - Learning profile (style, commitment)
   - Active plans count
   - Total progress across all plans
2. Quick actions:
   - Create new plan
   - Browse popular topics
   - Edit quiz results
3. Recent activity and recommendations

---

## Data Flow & User Journey

### Typical User Flow

1. **Signup & Quiz**
   - User creates account
   - Completes learning style quiz
   - Time commitment selected

2. **Topic Search**
   - Enters topic in search bar
   - System searches YouTube and static resources
   - Results filtered by learning style

3. **Plan Creation**
   - Option A: AI Generation
     - Click "Generate AI Path"
     - Gemini creates comprehensive pathway
     - Plan automatically saved
   - Option B: Manual Curation
     - Browse resources
     - Save favorites
     - Create custom plan

4. **Learning**
   - Navigate to plan in "Plans" or "Dashboard"
   - Click "Start Course"
   - Progress through resources in order
   - Mark items as complete
   - Progress saves automatically

5. **Continued Learning**
   - Add more resources to existing plans
   - Create new plans for different topics
   - Track progress across all learning paths

---

## Key Technical Features

### 1. Intelligent Duplicate Detection
- Uses `normalizeTopic()` to standardize topic names
- Prevents creating multiple plans for same subject
- Works across different URL formats and capitalizations

### 2. Robust Error Handling
- API fallback system for Gemini models
- Graceful degradation when external services fail
- User-friendly error messages with troubleshooting

### 3. Real-time Synchronization
- Firebase Firestore provides real-time updates
- Changes sync across devices instantly
- Offline support with Firebase persistence

### 4. Performance Optimization
- Next.js automatic code splitting
- Lazy loading of components
- Optimized bundle size
- Server-side rendering for fast initial load

### 5. Security
- Firebase Authentication with secure tokens
- Server-side API key protection
- Route guards prevent unauthorized access
- CORS protection for external APIs

### 6. Responsive Design
- Mobile-first Tailwind CSS
- Adapts to all screen sizes
- Touch-friendly interface
- Progressive enhancement

---

## Advanced Features

### Quiz Segment Identification
- Videos analyzed for key learning moments
- Future: Interactive quizzes at natural break points
- Metadata stored for quiz generation

### Content Analysis
- AI determines educational value (0-1 score)
- Credibility assessment
- Difficulty classification
- Learning style compatibility analysis

### Tag-Based Filtering
- Multi-dimensional resource browsing
- Filters by difficulty, type, style, category
- Dynamic tag generation from resource metadata

### Progress Visualization
- Circular progress indicators
- Completion percentages
- Estimated time remaining
- Visual badges for achievements

---

## Future Enhancements (Roadmap)

1. **Quiz System** - Interactive quizzes at video segments
2. **Social Features** - Share plans, collaborative learning
3. **Offline Mode** - Download resources for offline learning
4. **Mobile App** - Native iOS and Android applications
5. **Analytics Dashboard** - Detailed learning insights
6. **Custom Learning Paths** - AI-generated based on goals
7. **Certification** - Badge system for completed courses
8. **Integration** - Connect with calendar apps for scheduling

---

## Deployment

### Build Process
```bash
npm run build    # Creates optimized production build
npm run start    # Serves production build
npm run dev      # Development server with hot reload
```

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Keys
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Recommended Hosting
- **Vercel** (optimal for Next.js)
- **Netlify** (alternative)
- **Firebase Hosting** (tight Firebase integration)

---

## Performance Metrics

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Bundle Size:** ~250KB gzipped
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices)

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Contributing & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Google Cloud Console access for APIs

### Setup
```bash
npm install              # Install dependencies
npm run dev              # Start development server
```

### Code Structure
- Components are modular and reusable
- Library functions are pure and testable
- Type definitions ensure type safety
- Consistent naming conventions throughout

---

## License

MIT License - See LICENSE file for details

---

**Version:** 0.1.0  
**Last Updated:** 2024  
**Maintainer:** LearnMatch Team

