# Arvo AI 🤖

**Arvo AI** is an AI-powered personal agent and application-building platform designed to help users turn natural-language ideas into working web applications.

Users can describe what they want to build, and Arvo AI uses AI to generate and assist with application code, making the development process faster and more accessible.
Vercel : https://arvo-ai-omega.vercel.app/

## ✨ Features

* 🤖 **AI-Powered Development** — Generate application code using natural-language prompts.
* 💬 **AI Chat Interface** — Interact with the AI agent and refine your application through conversation.
* ⚡ **Next.js Application** — Built using modern Next.js App Router architecture.
* 🔐 **Authentication** — Secure user authentication and account management.
* 🗄️ **Database Integration** — Supabase-powered backend and data persistence.
* 🎨 **Modern UI** — Responsive interface designed with Tailwind CSS.
* 📦 **Component-Based Architecture** — Reusable React components for maintainable development.
* 🚀 **Vercel Deployment** — Optimized for production deployment on Vercel.
* 🧠 **AI Code Generation** — Generate and modify code based on user requirements.

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* JavaScript / JSX
* React Hooks

### Backend & APIs

* Next.js API Routes
* Node.js
* REST APIs

### Database & Authentication

* Supabase
* Clerk Authentication

### AI

* Google Gemini / Google Gen AI
* AI-powered code generation

### Development & Deployment

* Git
* GitHub
* Vercel
* npm

## 🏗️ Project Structure

```text
arvo-ai/
├── app/
│   ├── api/
│   │   └── gen-ai-code/
│   ├── workspace/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ChatPanel.tsx
│   └── ...
│
├── public/
│   └── ...
│
├── lib/
│   └── ...
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.*
└── README.md
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Aman2907/Arvo-AI.git
```

### 2. Navigate to the project

```bash
cd Arvo-AI
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the root directory and add the required environment variables.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

> **Important:** Never commit `.env.local` or expose API keys and secret credentials in your repository.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 💡 How Arvo AI Works

The basic workflow is:

```text
User Prompt
     ↓
Arvo AI Chat Interface
     ↓
AI Processing
     ↓
Code Generation
     ↓
Generated Application
     ↓
User Refinement
     ↓
Updated Application
```

For example, a user can enter:

> "Build a recipe finder with filters for cuisine, preparation time, and dietary preferences."

Arvo AI processes the request and generates the required application structure and code.

## 🔑 Core Workflow

### 1. User Authentication

Users sign in through the authentication system before accessing protected functionality.

### 2. Workspace

The workspace provides the main environment where users interact with Arvo AI.

### 3. Prompt

Users describe the application or feature they want to create using natural language.

### 4. AI Generation

The prompt is sent to the AI generation API, which processes the requirements and generates the appropriate code.

### 5. Iteration

Users can continue communicating with Arvo AI to modify or improve the generated application.

## 🧪 Development

Run the development server:

```bash
npm run dev
```

Run the production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Run linting:

```bash
npm run lint
```

## 🔒 Security

Arvo AI uses environment variables for sensitive configuration.

Do not commit:

```text
.env
.env.local
.env.production
```

API keys, authentication secrets, database credentials, and other sensitive information should always remain outside the source repository.

## 🚀 Deployment

Arvo AI can be deployed using Vercel.

Typical deployment workflow:

```text
GitHub Repository
       ↓
     Vercel
       ↓
Production Build
       ↓
   Arvo AI Live
```

Before deploying, make sure all required environment variables are configured in the Vercel project settings.

## 📈 Future Improvements

Planned improvements can include:

* [ ] Improved AI code generation
* [ ] Multi-model AI support
* [ ] AI-generated project previews
* [ ] Project history and versioning
* [ ] Code editor integration
* [ ] One-click application deployment
* [ ] Streaming AI responses
* [ ] Improved error handling and recovery
* [ ] Project templates
* [ ] File and folder management
* [ ] Collaborative workspaces

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Development workflow

```bash
git checkout -b feature/your-feature
npm install
npm run dev
```

Make your changes, test them locally, and create a pull request.

## 📄 License

This project is currently intended for development and portfolio purposes.

## 👨‍💻 Author

**Aman Sharma**

Full Stack Engineer focused on building modern web applications using React, Next.js, Node.js, TypeScript, databases, and AI-powered technologies.

---

⭐ If you find Arvo AI interesting, consider starring the repository.
