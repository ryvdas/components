# LearnMatch - Learn Anything

A personalized learning platform that matches educational resources to your unique learning style.

## 🚀 Features

- **Learning Style Quiz**: Discover your learning style (Visual, Auditory, Reading/Writing, Kinesthetic)
- **Personalized Resources**: Get curated YouTube videos and educational content based on your learning style
- **Save & Track Progress**: Bookmark resources and track your learning journey
- **Modern UI**: Clean, responsive design built with Next.js and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **APIs**: YouTube Data API v3
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- Firebase project
- YouTube Data API key
- Git

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd learnmatch
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password and Google)
4. Create a Firestore database
5. Get your Firebase config

### 3. YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create credentials (API Key)
4. Restrict the API key to YouTube Data API v3

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# YouTube Data API
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
learnmatch/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── auth/              # Authentication pages
│   ├── quiz/              # Learning style quiz
│   ├── learn/[topic]/     # Dynamic learning pages
│   └── saved/             # Saved resources page
├── components/            # Reusable components
│   ├── Navbar.tsx
│   ├── SearchBar.tsx
│   ├── QuizForm.tsx
│   ├── ResourceCard.tsx
│   └── ProgressTracker.tsx
├── lib/                   # Utility functions
│   ├── firebase.ts        # Firebase configuration
│   ├── youtube.ts         # YouTube API functions
│   └── resources.ts       # Static resources data
└── styles/               # Global styles
```

## 🎯 Key Features Implementation

### Learning Style Quiz
- Interactive quiz with 4 questions
- Calculates dominant learning style
- Stores results in Firestore

### Resource Matching
- Fetches YouTube videos based on topic
- Filters resources by learning style
- Displays curated content

### Progress Tracking
- Save resources to personal library
- Track completion status
- View learning statistics

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Firebase Hosting (Alternative)

```bash
npm run build
firebase deploy
```

## 🔮 Future Enhancements

- AI-powered resource summarization
- Custom learning paths
- Integration with more educational platforms
- Advanced progress analytics
- Social learning features
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@learnmatch.com or create an issue on GitHub.

---

Built with ❤️ for learners everywhere.
