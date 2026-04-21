import { GoogleGenerativeAI } from '@google/generative-ai';
import Roadmap from '../models/Roadmap.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback roadmap template function
const generateFallbackRoadmap = (interests, resumeText) => {
  const hasResume = resumeText && resumeText.trim() !== '';

  return `
# 🗺️ Personalized Career Roadmap for ${interests}

${hasResume ? '## Based on your resume analysis and interests' : '## Based on your interests'}

## 📋 12-Week Learning Plan

### Weeks 1-2: Foundation Building
**Goals:**
- Understand core concepts and fundamentals
- Set up development environment
- Learn basic terminology and principles

**Resources:**
- YouTube: FreeCodeCamp, Traversy Media, The Net Ninja
- Documentation: Official docs for your chosen technologies
- Practice: Complete basic tutorials and exercises

**Project:** Build a simple "Hello World" application

---

### Weeks 3-4: Core Skills Development
**Goals:**
- Master fundamental programming concepts
- Learn version control (Git)
- Understand project structure

**Resources:**
- GitHub: Explore open-source projects
- Online courses: Coursera, edX, Udemy free courses
- Practice platforms: Codecademy, freeCodeCamp

**Project:** Create a personal portfolio website

---

### Weeks 5-6: Intermediate Concepts
**Goals:**
- Learn frameworks and libraries
- Understand databases and APIs
- Practice debugging and testing

**Resources:**
- Official framework documentation
- YouTube tutorials for specific technologies
- Stack Overflow for problem-solving

**Project:** Build a CRUD application with database integration

---

### Weeks 7-8: Advanced Topics
**Goals:**
- Learn deployment and hosting
- Understand security best practices
- Explore advanced features

**Resources:**
- Cloud platforms documentation (AWS, Vercel, Netlify)
- Security guides and best practices
- Performance optimization tutorials

**Project:** Deploy your application to the cloud

---

### Weeks 9-10: Real-World Application
**Goals:**
- Work on a complex project
- Learn project management
- Practice collaboration tools

**Resources:**
- GitHub for collaboration
- Project management tools (Trello, Notion)
- Code review best practices

**Project:** Contribute to an open-source project or build a full-stack application

---

### Weeks 11-12: Portfolio & Career Prep
**Goals:**
- Polish your portfolio
- Prepare for interviews
- Network with professionals

**Resources:**
- LinkedIn Learning
- Interview preparation platforms
- Tech community forums and meetups

**Project:** Complete and showcase your final portfolio project

---

## 🎯 Key Milestones

- **Week 2:** Complete first functional project
- **Week 4:** Have a working portfolio website
- **Week 6:** Build and deploy a database-driven application
- **Week 8:** Successfully deploy to production
- **Week 10:** Contribute to open source or complete major project
- **Week 12:** Have a complete portfolio ready for job applications

## 📚 Recommended Learning Resources

**Free Platforms:**
- freeCodeCamp
- Codecademy (free tier)
- Khan Academy
- YouTube educational channels

**Documentation:**
- MDN Web Docs
- Official technology documentation
- W3Schools

**Practice:**
- LeetCode (for algorithms)
- HackerRank
- Codewars

## 💡 Tips for Success

1. **Consistency is key** - Study a little every day
2. **Build projects** - Apply what you learn immediately
3. **Join communities** - Connect with other learners
4. **Ask questions** - Don't hesitate to seek help
5. **Document your journey** - Keep track of your progress

---

*This roadmap is customized for your interests in: ${interests}*
${hasResume ? '*Additional recommendations based on your background have been included.*' : '*Consider uploading your resume for more personalized recommendations.*'}
`;
};

export const generateRoadmap = async (req, res) => {
  try {
    const { resumeText, interests, userId, experienceLevel = 'beginner', targetRole } = req.body;

    // Validate required fields
    if (!interests) {
      return res.status(400).json({ message: 'Please provide your interests' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    console.log('Generating roadmap for user:', userId);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let roadmapText;
    let generatedBy = 'template';
    let aiModel = null;

    // Check if Gemini API is available and valid
    if (!process.env.GEMINI_API_KEY) {
      console.log('Using fallback roadmap generation - no API key');
      roadmapText = generateFallbackRoadmap(interests, resumeText);
    } else {
      // Try to use Gemini API
      try {
        // Limit resume text to prevent payload issues (keep first 3000 characters)
        const limitedResumeText = resumeText ? resumeText.substring(0, 3000) : 'No resume provided';

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
        Given this resume summary:
        ${limitedResumeText}

        And these career interests: ${interests}
        Experience level: ${experienceLevel}
        ${targetRole ? `Target role: ${targetRole}` : ''}

        Generate a detailed 12-week personalized learning roadmap with:
        - Weekly learning goals
        - Specific skills to focus on each week
        - Recommended free resources (YouTube channels, courses, documentation)
        - Project ideas for hands-on practice
        - Milestones to track progress

        Format the response in a clear, structured way with headings and bullet points.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        roadmapText = response.text();
        generatedBy = 'ai';
        aiModel = 'gemini-pro';

      } catch (apiError) {
        console.log('Gemini API failed, using fallback:', apiError.message);
        roadmapText = generateFallbackRoadmap(interests, resumeText);
      }
    }

    // Create and save roadmap to database
    const roadmapData = {
      userId,
      title: `${interests} Learning Roadmap`,
      description: `Personalized 12-week learning roadmap for ${interests}`,
      interests: Array.isArray(interests) ? interests : [interests],
      targetRole,
      experienceLevel,
      generatedBy,
      aiModel,
      rawContent: roadmapText,
      roadmapText, // Keep for backward compatibility
      resumeText,
      category: categorizeInterests(interests),
      tags: extractTags(interests),
      progress: {
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000)) // 12 weeks from now
      }
    };

    const savedRoadmap = await Roadmap.create(roadmapData);

    // Create initial progress tracking
    const progressData = {
      userId,
      roadmapId: savedRoadmap._id,
      overallProgress: {
        totalWeeks: 12,
        lastActivityDate: new Date()
      }
    };

    await Progress.create(progressData);

    // Update user's last activity
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      $inc: { loginCount: 1 }
    });

    res.json({
      roadmapText,
      roadmapId: savedRoadmap._id,
      message: generatedBy === 'ai' ? 'AI-powered roadmap generated successfully' : 'Roadmap generated successfully (using template)',
      note: generatedBy === 'template' ? 'AI service temporarily unavailable, using structured template' : undefined,
      roadmap: {
        id: savedRoadmap._id,
        title: savedRoadmap.title,
        createdAt: savedRoadmap.createdAt,
        progress: savedRoadmap.progress
      }
    });

  } catch (error) {
    console.error('Error generating roadmap:', error);

    // Always provide a fallback
    const roadmapText = generateFallbackRoadmap(req.body.interests || 'General Technology', req.body.resumeText);

    res.json({
      roadmapText,
      message: 'Roadmap generated successfully (using template)',
      note: 'Service temporarily unavailable, using structured template'
    });
  }
};

// Helper functions
const categorizeInterests = (interests) => {
  const interestsStr = Array.isArray(interests) ? interests.join(' ').toLowerCase() : interests.toLowerCase();

  if (interestsStr.includes('web') || interestsStr.includes('react') || interestsStr.includes('javascript') || interestsStr.includes('frontend') || interestsStr.includes('backend')) {
    return 'web-development';
  } else if (interestsStr.includes('mobile') || interestsStr.includes('android') || interestsStr.includes('ios') || interestsStr.includes('flutter') || interestsStr.includes('react native')) {
    return 'mobile-development';
  } else if (interestsStr.includes('data') || interestsStr.includes('machine learning') || interestsStr.includes('ai') || interestsStr.includes('python') || interestsStr.includes('analytics')) {
    return 'data-science';
  } else if (interestsStr.includes('devops') || interestsStr.includes('cloud') || interestsStr.includes('aws') || interestsStr.includes('docker') || interestsStr.includes('kubernetes')) {
    return 'devops';
  } else if (interestsStr.includes('game') || interestsStr.includes('unity') || interestsStr.includes('unreal')) {
    return 'game-development';
  } else if (interestsStr.includes('cyber') || interestsStr.includes('security') || interestsStr.includes('ethical hacking')) {
    return 'cybersecurity';
  }
  return 'general-technology';
};

const extractTags = (interests) => {
  const interestsStr = Array.isArray(interests) ? interests.join(' ').toLowerCase() : interests.toLowerCase();
  const tags = [];

  // Technology tags
  const techKeywords = ['javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'flutter', 'swift', 'kotlin', 'c++', 'c#', 'go', 'rust', 'php', 'ruby'];
  techKeywords.forEach(tech => {
    if (interestsStr.includes(tech)) tags.push(tech);
  });

  // Domain tags
  const domainKeywords = ['frontend', 'backend', 'fullstack', 'mobile', 'web', 'ai', 'ml', 'data', 'cloud', 'devops', 'security'];
  domainKeywords.forEach(domain => {
    if (interestsStr.includes(domain)) tags.push(domain);
  });

  return [...new Set(tags)]; // Remove duplicates
};

// Get user's roadmaps
export const getUserRoadmaps = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const roadmaps = await Roadmap.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email profile.firstName profile.lastName');

    const total = await Roadmap.countDocuments(query);

    res.json({
      roadmaps,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ message: 'Failed to fetch roadmaps' });
  }
};

// Get specific roadmap
export const getRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params;

    const roadmap = await Roadmap.findById(roadmapId)
      .populate('userId', 'name email profile.firstName profile.lastName');

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Increment view count
    roadmap.views += 1;
    await roadmap.save();

    res.json({ roadmap });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap' });
  }
};

// Update roadmap
export const updateRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const updates = req.body;

    const roadmap = await Roadmap.findByIdAndUpdate(
      roadmapId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    res.json({ roadmap, message: 'Roadmap updated successfully' });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    res.status(500).json({ message: 'Failed to update roadmap' });
  }
};

// Delete roadmap
export const deleteRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params;

    const roadmap = await Roadmap.findByIdAndDelete(roadmapId);

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Also delete associated progress
    await Progress.deleteMany({ roadmapId });

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ message: 'Failed to delete roadmap' });
  }
};
