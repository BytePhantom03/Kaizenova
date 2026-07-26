"""
Learning Resources Service

Provides curated free learning resources mapped to topic/skill weak areas.
Resources are matched against the user's weak_areas from InterviewReports
and returned grouped by category with direct clickable URLs.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from uuid import UUID
from typing import List, Dict, Any

from app.models.database.analytics import InterviewReport, Recommendation
from app.utils.logger import logger

# ─── Curated Resource Library ──────────────────────────────────────────────────
# All resources are 100% free. Grouped by canonical topic keys.
# Each resource has: title, description, platform, url, duration, level, icon

RESOURCE_LIBRARY: Dict[str, List[Dict[str, Any]]] = {

    # ── Soft Skills ──────────────────────────────────────────────────────────
    "communication": [
        {
            "title": "Communication Skills for Beginners",
            "description": "Learn how to express yourself clearly and confidently in interviews and professional settings.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=HAnw168huqA",
            "duration": "~45 min",
            "level": "Beginner",
            "icon": "📢",
        },
        {
            "title": "Effective Communication Skills – Full Course",
            "description": "Covers active listening, body language, and clear speech patterns used in professional environments.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=tSKRBDiVbpA",
            "duration": "~2 hr",
            "level": "Beginner",
            "icon": "🎙️",
        },
        {
            "title": "Public Speaking & Presentation – Coursera (Free Audit)",
            "description": "University-level course on structuring ideas and delivering them persuasively.",
            "platform": "Coursera",
            "url": "https://www.coursera.org/learn/public-speaking",
            "duration": "~10 hr",
            "level": "Intermediate",
            "icon": "🎓",
        },
    ],
    "confidence": [
        {
            "title": "How to Speak with Confidence – TED Talk Collection",
            "description": "Curated TED Talks on overcoming nervousness and projecting authority when speaking.",
            "platform": "TED",
            "url": "https://www.ted.com/playlists/226/before_public_speaking",
            "duration": "~2 hr",
            "level": "Beginner",
            "icon": "💪",
        },
        {
            "title": "Stop Saying Um & Filler Words – Speech Coach Tips",
            "description": "Practical exercises to eliminate filler words and improve interview fluency.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=mflRLxbNrOI",
            "duration": "~20 min",
            "level": "Beginner",
            "icon": "🗣️",
        },
        {
            "title": "The Science of Self-Confidence",
            "description": "Psychology-backed techniques to build genuine confidence before high-stakes interviews.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=w-HYZv6HzAs",
            "duration": "~30 min",
            "level": "Beginner",
            "icon": "🧠",
        },
    ],
    "grammar": [
        {
            "title": "English Grammar Full Course",
            "description": "Comprehensive grammar course covering tenses, sentence structure, and punctuation from scratch.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=Rp3LqMYBhkQ",
            "duration": "~4 hr",
            "level": "Beginner",
            "icon": "📝",
        },
        {
            "title": "Grammarly Handbook",
            "description": "Free online reference for grammar rules, style guides, and writing tips.",
            "platform": "Grammarly",
            "url": "https://www.grammarly.com/blog/category/handbook/",
            "duration": "Self-paced",
            "level": "All Levels",
            "icon": "✍️",
        },
        {
            "title": "Technical Writing – Google Developer Docs",
            "description": "Learn how to write clear and precise technical content, ideal for written answers.",
            "platform": "Google Developers",
            "url": "https://developers.google.com/tech-writing",
            "duration": "~4 hr",
            "level": "Intermediate",
            "icon": "📖",
        },
    ],

    # ── Technical Accuracy / Problem Solving ────────────────────────────────
    "technical accuracy": [
        {
            "title": "CS50: Introduction to Computer Science",
            "description": "Harvard's legendary intro CS course — covers problem solving, algorithms, and C, Python, SQL, and JavaScript.",
            "platform": "Harvard / edX (Free)",
            "url": "https://cs50.harvard.edu/x/",
            "duration": "~12 weeks",
            "level": "Beginner",
            "icon": "🏛️",
        },
        {
            "title": "The Missing Semester of Your CS Education",
            "description": "MIT course covering practical dev tools, debugging, and systems thinking often missed in degrees.",
            "platform": "MIT (Free)",
            "url": "https://missing.csail.mit.edu/",
            "duration": "~10 hr",
            "level": "Intermediate",
            "icon": "🔧",
        },
    ],

    # ── Data Structures & Algorithms ────────────────────────────────────────
    "dsa": [
        {
            "title": "Data Structures and Algorithms Full Course",
            "description": "Complete DSA course in Python with animations and exercises covering arrays, trees, graphs, and DP.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=pkYVOmU3MgA",
            "duration": "~8 hr",
            "level": "Intermediate",
            "icon": "🌲",
        },
        {
            "title": "NeetCode Roadmap – LeetCode Patterns",
            "description": "Structured roadmap of 150 LeetCode problems organized by pattern, with free video solutions.",
            "platform": "NeetCode (Free)",
            "url": "https://neetcode.io/roadmap",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "🗺️",
        },
        {
            "title": "Algorithms Specialization – Stanford (Free Audit)",
            "description": "Stanford's rigorous algorithms course covering sorting, graphs, shortest paths, and NP-completeness.",
            "platform": "Coursera (Free Audit)",
            "url": "https://www.coursera.org/specializations/algorithms",
            "duration": "~60 hr",
            "level": "Advanced",
            "icon": "📊",
        },
    ],
    "algorithms": [
        {
            "title": "Algorithms and Data Structures – Abdul Bari",
            "description": "Clear, visual explanations of sorting, searching, and graph algorithms by a popular YouTube educator.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O",
            "duration": "~22 hr",
            "level": "Intermediate",
            "icon": "🔄",
        },
    ],

    # ── System Design ────────────────────────────────────────────────────────
    "system design": [
        {
            "title": "System Design Primer",
            "description": "Most-starred GitHub repo on system design — covers scalability, load balancing, caching, and databases.",
            "platform": "GitHub (Free)",
            "url": "https://github.com/donnemartin/system-design-primer",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "🏗️",
        },
        {
            "title": "System Design for Beginners – Full Course",
            "description": "Beginner-friendly video course explaining how to design real systems like Netflix, Uber, and WhatsApp.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=m8Icp_Cid5o",
            "duration": "~3 hr",
            "level": "Beginner",
            "icon": "⚙️",
        },
        {
            "title": "ByteByteGo System Design Newsletter",
            "description": "Visual system design articles by the author of the most popular system design book.",
            "platform": "ByteByteGo (Free tier)",
            "url": "https://blog.bytebytego.com/",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "📬",
        },
    ],

    # ── Object Oriented Programming ──────────────────────────────────────────
    "oop": [
        {
            "title": "Object Oriented Programming – Full Course for Beginners",
            "description": "Covers all OOP principles (Encapsulation, Inheritance, Polymorphism, Abstraction) with Python examples.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=Ej_02ICOIgs",
            "duration": "~2 hr",
            "level": "Beginner",
            "icon": "🏛️",
        },
        {
            "title": "Design Patterns – Refactoring Guru",
            "description": "Free, illustrated guide to all 23 classic design patterns with code examples in multiple languages.",
            "platform": "Refactoring Guru (Free)",
            "url": "https://refactoring.guru/design-patterns",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "🎨",
        },
    ],
    "object oriented": [
        {
            "title": "Object Oriented Programming – Full Course for Beginners",
            "description": "Covers all OOP principles with clear Python examples and exercises.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=Ej_02ICOIgs",
            "duration": "~2 hr",
            "level": "Beginner",
            "icon": "🏛️",
        },
    ],

    # ── Python ───────────────────────────────────────────────────────────────
    "python": [
        {
            "title": "Python Full Course for Beginners",
            "description": "Complete Python course covering syntax, functions, OOP, file I/O, and projects from scratch.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
            "duration": "~4.5 hr",
            "level": "Beginner",
            "icon": "🐍",
        },
        {
            "title": "Python Documentation – Official Tutorial",
            "description": "The official Python tutorial — comprehensive, free, and always up-to-date.",
            "platform": "Python.org",
            "url": "https://docs.python.org/3/tutorial/",
            "duration": "Self-paced",
            "level": "Beginner",
            "icon": "📄",
        },
        {
            "title": "Fluent Python Concepts – YouTube Playlist",
            "description": "Advanced Python patterns, metaclasses, decorators, and idiomatic Python for experienced devs.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=p15xzjzR9j0",
            "duration": "~3 hr",
            "level": "Advanced",
            "icon": "⚡",
        },
    ],

    # ── JavaScript ───────────────────────────────────────────────────────────
    "javascript": [
        {
            "title": "JavaScript Full Course for Beginners",
            "description": "Covers all modern JavaScript (ES6+) concepts from variables to async/await.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg",
            "duration": "~3.5 hr",
            "level": "Beginner",
            "icon": "💛",
        },
        {
            "title": "The Modern JavaScript Tutorial",
            "description": "The most comprehensive free JavaScript reference, from basics to advanced topics like promises and modules.",
            "platform": "javascript.info",
            "url": "https://javascript.info/",
            "duration": "Self-paced",
            "level": "All Levels",
            "icon": "📒",
        },
        {
            "title": "JavaScript Algorithms and Data Structures",
            "description": "freeCodeCamp's 300+ hour interactive certification covering JS fundamentals and algorithms.",
            "platform": "freeCodeCamp",
            "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            "duration": "~300 hr",
            "level": "Intermediate",
            "icon": "🏆",
        },
    ],

    # ── React ────────────────────────────────────────────────────────────────
    "react": [
        {
            "title": "React Full Course for Beginners",
            "description": "Covers React hooks, state management, component design, and building a real app from scratch.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=bMknfKXIFA8",
            "duration": "~12 hr",
            "level": "Beginner",
            "icon": "⚛️",
        },
        {
            "title": "Official React Documentation",
            "description": "React's newly rewritten docs with interactive examples and in-depth guides for all concepts.",
            "platform": "React.dev",
            "url": "https://react.dev/learn",
            "duration": "Self-paced",
            "level": "All Levels",
            "icon": "📗",
        },
    ],

    # ── Databases & SQL ──────────────────────────────────────────────────────
    "sql": [
        {
            "title": "SQL Full Course – Learn SQL in 4 Hours",
            "description": "Covers SELECT, JOINs, subqueries, indexes, and common SQL interview questions.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY",
            "duration": "~4 hr",
            "level": "Beginner",
            "icon": "🗄️",
        },
        {
            "title": "SQL Tutorial – SQLZoo",
            "description": "Interactive browser-based SQL exercises covering SELECT, GROUP BY, and complex joins.",
            "platform": "SQLZoo (Free)",
            "url": "https://sqlzoo.net/",
            "duration": "Self-paced",
            "level": "Beginner",
            "icon": "🐘",
        },
        {
            "title": "Database Management Essentials – Coursera (Free Audit)",
            "description": "University course covering relational models, SQL, and database design principles.",
            "platform": "Coursera (Free Audit)",
            "url": "https://www.coursera.org/learn/database-management",
            "duration": "~20 hr",
            "level": "Intermediate",
            "icon": "🎓",
        },
    ],
    "database": [
        {
            "title": "SQL Full Course – Learn SQL in 4 Hours",
            "description": "Covers SELECT, JOINs, subqueries, indexes, and SQL interview patterns.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY",
            "duration": "~4 hr",
            "level": "Beginner",
            "icon": "🗄️",
        },
    ],

    # ── OS & Networking ──────────────────────────────────────────────────────
    "operating systems": [
        {
            "title": "Operating Systems: Three Easy Pieces",
            "description": "Free, well-written textbook covering processes, threads, memory, and file systems.",
            "platform": "OSTEP (Free PDF)",
            "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "🖥️",
        },
    ],
    "networking": [
        {
            "title": "Computer Networking Full Course – Kurose & Ross",
            "description": "Covers HTTP, TCP/IP, DNS, CDN, and networking concepts essential for system design interviews.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW",
            "duration": "~15 hr",
            "level": "Intermediate",
            "icon": "🌐",
        },
    ],

    # ── Cloud & DevOps ───────────────────────────────────────────────────────
    "cloud": [
        {
            "title": "AWS Cloud Practitioner – Full Course",
            "description": "Free exam prep course for the AWS CCP, covering core cloud services and concepts.",
            "platform": "freeCodeCamp (YouTube)",
            "url": "https://www.youtube.com/watch?v=SOTamWNgDKc",
            "duration": "~14 hr",
            "level": "Beginner",
            "icon": "☁️",
        },
        {
            "title": "Microsoft Azure Fundamentals (AZ-900) – Free",
            "description": "Microsoft's official free learning path for cloud fundamentals.",
            "platform": "Microsoft Learn",
            "url": "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
            "duration": "~10 hr",
            "level": "Beginner",
            "icon": "🔷",
        },
    ],
    "devops": [
        {
            "title": "DevOps Roadmap – Full Guide",
            "description": "Step-by-step roadmap covering Linux, Git, Docker, Kubernetes, and CI/CD.",
            "platform": "roadmap.sh (Free)",
            "url": "https://roadmap.sh/devops",
            "duration": "Self-paced",
            "level": "Intermediate",
            "icon": "🔁",
        },
    ],

    # ── Behavioural / HR Interviews ──────────────────────────────────────────
    "behavioural": [
        {
            "title": "STAR Method – Behavioural Interview Masterclass",
            "description": "Master the Situation-Task-Action-Result framework for answering behavioural questions.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=0nN7Q7DrI6Q",
            "duration": "~30 min",
            "level": "Beginner",
            "icon": "⭐",
        },
        {
            "title": "Top 10 Behavioural Interview Questions & Answers",
            "description": "Structured answers to the most common HR interview questions with worked examples.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=1mHjMNZZvFo",
            "duration": "~1 hr",
            "level": "Beginner",
            "icon": "🎯",
        },
    ],
    "hr": [
        {
            "title": "HR Interview Questions Preparation",
            "description": "Complete guide to answering salary, culture, teamwork, and career-goal HR questions.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=KVIKIwgqPlY",
            "duration": "~45 min",
            "level": "Beginner",
            "icon": "🤝",
        },
    ],

    # ── Completeness / Depth ─────────────────────────────────────────────────
    "completeness": [
        {
            "title": "How to Answer Interview Questions Completely",
            "description": "Techniques to structure comprehensive answers that cover all aspects of a question.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=aXoLmwoDHAs",
            "duration": "~20 min",
            "level": "Beginner",
            "icon": "✅",
        },
        {
            "title": "STAR & SOAR Method for Structured Answers",
            "description": "Learn frameworks to give complete, well-structured answers that impress interviewers.",
            "platform": "YouTube",
            "url": "https://www.youtube.com/watch?v=WSbN-0swDgM",
            "duration": "~25 min",
            "level": "Beginner",
            "icon": "🗂️",
        },
    ],
}

# ─── Keyword → canonical topic mapping ───────────────────────────────────────
# Maps raw weak_area strings (from DB) to our RESOURCE_LIBRARY keys
TOPIC_ALIASES: Dict[str, str] = {
    # soft skills
    "communication": "communication",
    "confidence": "confidence",
    "grammar": "grammar",
    "grammar & syntax": "grammar",
    "fluency": "confidence",
    "filler words": "confidence",

    # technical
    "technical accuracy": "technical accuracy",
    "technical": "technical accuracy",
    "problem solving": "dsa",
    "problem-solving": "dsa",
    "data structures": "dsa",
    "data structures and algorithms": "dsa",
    "dsa": "dsa",
    "algorithms": "algorithms",
    "sorting": "algorithms",
    "searching": "algorithms",
    "dynamic programming": "algorithms",
    "recursion": "algorithms",

    # system design
    "system design": "system design",
    "scalability": "system design",
    "distributed systems": "system design",
    "microservices": "system design",
    "api design": "system design",
    "architecture": "system design",

    # oop / design patterns
    "oop": "oop",
    "object oriented": "oop",
    "object-oriented programming": "oop",
    "design patterns": "oop",
    "solid principles": "oop",

    # languages
    "python": "python",
    "javascript": "javascript",
    "js": "javascript",
    "typescript": "javascript",
    "react": "react",
    "reactjs": "react",
    "next.js": "react",

    # databases
    "sql": "sql",
    "mysql": "sql",
    "postgresql": "sql",
    "nosql": "database",
    "mongodb": "database",
    "database": "database",
    "databases": "database",

    # infra
    "operating systems": "operating systems",
    "os": "operating systems",
    "networking": "networking",
    "computer networks": "networking",
    "cloud": "cloud",
    "aws": "cloud",
    "azure": "cloud",
    "gcp": "cloud",
    "devops": "devops",
    "docker": "devops",
    "kubernetes": "devops",
    "ci/cd": "devops",

    # completeness / behavioural
    "completeness": "completeness",
    "depth": "completeness",
    "behavioural": "behavioural",
    "behavioral": "behavioural",
    "hr": "hr",
    "soft skills": "communication",
}


def _normalize_topic(raw: str) -> str | None:
    """Map a raw weak_area string to a canonical resource library key."""
    lower = raw.strip().lower()
    # Direct match
    if lower in RESOURCE_LIBRARY:
        return lower
    # Alias lookup
    if lower in TOPIC_ALIASES:
        return TOPIC_ALIASES[lower]
    # Partial match against aliases
    for alias, canonical in TOPIC_ALIASES.items():
        if alias in lower or lower in alias:
            return canonical
    return None


class LearningResourceService:

    async def get_resources(self, db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        """
        Build a personalised list of free learning resources based on the
        user's weak_areas from their last 5 InterviewReports and any
        pending Recommendations.

        Returns:
          {
            "groups": [
              {
                "topic": "system design",
                "label": "System Design",
                "resources": [ ... ]
              },
              ...
            ],
            "total_resources": int,
            "source": "personalized" | "default"
          }
        """
        # 1. Collect raw weak areas from recent reports
        reports_result = await db.execute(
            select(InterviewReport.weak_areas, InterviewReport.created_at)
            .where(InterviewReport.user_id == user_id)
            .order_by(InterviewReport.created_at.desc())
            .limit(5)
        )
        reports = reports_result.all()

        raw_weak: List[str] = []
        for row in reports:
            weak_areas_json = row[0]
            if weak_areas_json and isinstance(weak_areas_json, list):
                raw_weak.extend(weak_areas_json)

        # 2. Also pull from Recommendation model
        recs_result = await db.execute(
            select(Recommendation.weak_area)
            .where(Recommendation.user_id == user_id, Recommendation.status == "pending")
            .order_by(Recommendation.created_at.desc())
            .limit(10)
        )
        for row in recs_result:
            if row[0]:
                raw_weak.append(row[0])

        # 3. Normalize and deduplicate topics
        seen_topics: set = set()
        ordered_topics: List[str] = []
        for raw in raw_weak:
            topic = _normalize_topic(raw)
            if topic and topic not in seen_topics and topic in RESOURCE_LIBRARY:
                seen_topics.add(topic)
                ordered_topics.append(topic)

        source = "personalized"

        # 4. Fallback: if no personalized data, serve top general resources
        if not ordered_topics:
            ordered_topics = ["communication", "technical accuracy", "dsa", "system design"]
            source = "default"

        # 5. Build response groups
        groups = []
        total = 0
        for topic in ordered_topics:
            resources = RESOURCE_LIBRARY.get(topic, [])
            if not resources:
                continue
            label = topic.replace("_", " ").title()
            groups.append({
                "topic": topic,
                "label": label,
                "resources": resources,
            })
            total += len(resources)

        return {
            "groups": groups,
            "total_resources": total,
            "source": source,
        }


learning_resource_service = LearningResourceService()
