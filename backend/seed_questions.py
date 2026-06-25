"""
Seed script to populate the questions table with interview questions.
Run from the backend directory: python seed_questions.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import uuid

QUESTIONS = [
    # ── Software Engineering – Technical ──────────────────────────────────
    {"domain": "Software Engineering", "difficulty": 3, "question_type": "technical",
     "question_text": "What is the difference between a stack and a queue? Give a real-world example of each.",
     "expected_answer": "A stack is LIFO (last-in, first-out) — like a pile of plates. A queue is FIFO (first-in, first-out) — like a line at a checkout counter.",
     "key_concepts": ["LIFO", "FIFO", "stack", "queue"],
     "hints": {"hint1": "Think about the order items are removed."}},

    {"domain": "Software Engineering", "difficulty": 4, "question_type": "technical",
     "question_text": "Explain the concept of Big-O notation. What is the time complexity of binary search and why?",
     "expected_answer": "Big-O describes the worst-case growth rate of an algorithm. Binary search is O(log n) because it halves the search space each iteration.",
     "key_concepts": ["Big-O", "time complexity", "binary search", "O(log n)"],
     "hints": {"hint1": "Think about how the problem size shrinks with each step."}},

    {"domain": "Software Engineering", "difficulty": 5, "question_text": "What is the difference between a process and a thread? When would you use one over the other?",
     "question_type": "technical",
     "expected_answer": "A process has its own memory space; threads share memory within a process. Use threads for I/O-bound concurrent tasks; use processes for CPU-bound tasks to avoid GIL in Python.",
     "key_concepts": ["process", "thread", "memory", "concurrency", "GIL"],
     "hints": {"hint1": "Think about memory isolation."}},

    {"domain": "Software Engineering", "difficulty": 6, "question_type": "technical",
     "question_text": "Describe the SOLID principles. Give an example of one principle in practice.",
     "expected_answer": "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. E.g., SRP: a User class should handle user data, not email sending.",
     "key_concepts": ["SOLID", "SRP", "OCP", "LSP", "ISP", "DIP"],
     "hints": {"hint1": "Think about why tight coupling is bad."}},

    {"domain": "Software Engineering", "difficulty": 7, "question_type": "technical",
     "question_text": "What is a deadlock? How can you detect and prevent it in a concurrent system?",
     "expected_answer": "A deadlock occurs when two or more threads each hold a resource the other needs and neither can proceed. Prevention: resource ordering, timeouts, try-lock patterns.",
     "key_concepts": ["deadlock", "mutex", "lock ordering", "prevention"],
     "hints": {"hint1": "Think about the four Coffman conditions."}},

    {"domain": "Software Engineering", "difficulty": 8, "question_type": "technical",
     "question_text": "Explain how a hash map works internally. What happens during a collision and how is it resolved?",
     "expected_answer": "A hash map uses a hash function to map keys to buckets. Collisions are resolved via chaining (linked lists) or open addressing (probing). Load factor determines when to resize.",
     "key_concepts": ["hash function", "collision", "chaining", "open addressing", "load factor"],
     "hints": {"hint1": "Think about what happens when two keys produce the same hash."}},

    {"domain": "Software Engineering", "difficulty": 9, "question_type": "technical",
     "question_text": "What is a distributed transaction? How does the two-phase commit protocol work?",
     "expected_answer": "A distributed transaction spans multiple nodes. 2PC has a prepare phase (all participants vote commit/abort) and a commit phase. A coordinator decides based on votes. Risk: coordinator failure mid-protocol.",
     "key_concepts": ["distributed transaction", "2PC", "coordinator", "prepare phase", "commit phase", "ACID"],
     "hints": {"hint1": "Think about what happens if the coordinator fails after prepare."}},

    # ── Software Engineering – Behavioral ─────────────────────────────────
    {"domain": "Software Engineering", "difficulty": 3, "question_type": "behavioral",
     "question_text": "Tell me about a time you had to learn a new technology quickly. How did you approach it?",
     "expected_answer": "Use STAR format: Situation, Task, Action, Result. Focus on resourcefulness, speed of learning, and the outcome.",
     "key_concepts": ["STAR method", "learning agility", "resourcefulness"],
     "hints": {"hint1": "Use specific tools and timelines."}},

    {"domain": "Software Engineering", "difficulty": 5, "question_type": "behavioral",
     "question_text": "Describe a situation where you disagreed with a technical decision made by your team. How did you handle it?",
     "expected_answer": "Show respectful disagreement, data-driven arguments, willingness to compromise, and ultimately supporting the team decision.",
     "key_concepts": ["conflict resolution", "technical communication", "team collaboration"],
     "hints": {"hint1": "Focus on how you influenced with evidence, not authority."}},

    {"domain": "Software Engineering", "difficulty": 6, "question_type": "behavioral",
     "question_text": "Tell me about the most complex technical project you have worked on. What made it complex and how did you manage it?",
     "expected_answer": "Highlight architectural decisions, cross-team coordination, risk management, and measurable outcomes.",
     "key_concepts": ["project management", "complexity", "architecture", "leadership"],
     "hints": {"hint1": "Quantify the scale: team size, users affected, performance improvements."}},

    # ── System Design ────────────────────────────────────────────────────
    {"domain": "Software Engineering", "difficulty": 7, "question_type": "system_design",
     "question_text": "Design a URL shortener like bit.ly. What are the key components and trade-offs?",
     "expected_answer": "Key components: API server, Base62 encoder, database (SQL for simplicity, NoSQL for scale), cache (Redis), CDN. Trade-offs: collision avoidance, custom aliases, analytics.",
     "key_concepts": ["Base62", "Redis cache", "database sharding", "CDN", "rate limiting"],
     "hints": {"hint1": "Start with the URL encoding algorithm, then scale."}},

    {"domain": "Software Engineering", "difficulty": 8, "question_type": "system_design",
     "question_text": "How would you design a real-time chat system for 10 million concurrent users?",
     "expected_answer": "WebSockets for bidirectional communication, message queues (Kafka), horizontal scaling of WebSocket servers with sticky sessions, distributed caching, and persistent message store.",
     "key_concepts": ["WebSockets", "Kafka", "horizontal scaling", "sticky sessions", "message persistence"],
     "hints": {"hint1": "Think about message delivery guarantees and presence indicators."}},

    # ── Frontend ─────────────────────────────────────────────────────────
    {"domain": "Frontend", "difficulty": 4, "question_type": "technical",
     "question_text": "Explain the difference between the virtual DOM and the real DOM. How does React use this to improve performance?",
     "expected_answer": "The virtual DOM is a lightweight JS representation of the real DOM. React diffs it with the previous state and only updates changed nodes (reconciliation), reducing expensive real DOM mutations.",
     "key_concepts": ["virtual DOM", "reconciliation", "diffing", "React fiber"],
     "hints": {"hint1": "Think about why DOM manipulation is expensive."}},

    {"domain": "Frontend", "difficulty": 5, "question_type": "technical",
     "question_text": "What is the event loop in JavaScript? How does it handle asynchronous code?",
     "expected_answer": "JS is single-threaded. The event loop processes the call stack, then checks the callback/microtask queues. Promises go to microtask queue (higher priority), setTimeout to macro-task queue.",
     "key_concepts": ["event loop", "call stack", "microtask queue", "macro-task", "Promise"],
     "hints": {"hint1": "Explain the order: call stack → microtasks → macrotasks."}},

    {"domain": "Frontend", "difficulty": 6, "question_type": "technical",
     "question_text": "What is CSS specificity? How does the cascade resolve conflicting styles?",
     "expected_answer": "Specificity is calculated as (inline, IDs, classes, elements). Higher specificity wins. Equal specificity: last rule wins. !important overrides all.",
     "key_concepts": ["specificity", "cascade", "inheritance", "!important"],
     "hints": {"hint1": "Try calculating specificity for: #id .class element"}},

    # ── Backend ──────────────────────────────────────────────────────────
    {"domain": "Backend", "difficulty": 5, "question_type": "technical",
     "question_text": "What is the difference between REST and GraphQL? When would you choose one over the other?",
     "expected_answer": "REST uses fixed endpoints per resource; GraphQL uses a single endpoint with flexible queries. Use GraphQL when clients need varied data shapes; REST for simple, well-defined resources.",
     "key_concepts": ["REST", "GraphQL", "over-fetching", "under-fetching", "schema"],
     "hints": {"hint1": "Think about the N+1 query problem."}},

    {"domain": "Backend", "difficulty": 6, "question_type": "technical",
     "question_text": "Explain database indexing. What are the trade-offs of adding too many indexes?",
     "expected_answer": "Indexes speed up reads via B-tree or hash structures. Trade-offs: slower writes (index must be updated), more storage. Too many indexes degrade write performance significantly.",
     "key_concepts": ["B-tree index", "read performance", "write performance", "storage", "composite index"],
     "hints": {"hint1": "Think about what happens to an index during an INSERT."}},

    {"domain": "Backend", "difficulty": 7, "question_type": "technical",
     "question_text": "What is database normalization? Explain the first three normal forms with examples.",
     "expected_answer": "1NF: atomic values, no repeating groups. 2NF: no partial dependency on composite keys. 3NF: no transitive dependencies. Each eliminates redundancy progressively.",
     "key_concepts": ["1NF", "2NF", "3NF", "normalization", "anomalies", "denormalization"],
     "hints": {"hint1": "Think about what update anomalies normalization prevents."}},

    # ── Data Science ─────────────────────────────────────────────────────
    {"domain": "Data Science", "difficulty": 5, "question_type": "technical",
     "question_text": "What is overfitting in machine learning? How do you detect and prevent it?",
     "expected_answer": "Overfitting: model memorizes training data, fails on unseen data. Detection: large train-test gap. Prevention: regularization (L1/L2), dropout, cross-validation, more data.",
     "key_concepts": ["overfitting", "bias-variance tradeoff", "regularization", "cross-validation"],
     "hints": {"hint1": "Think about the training vs validation loss curves."}},

    {"domain": "Data Science", "difficulty": 7, "question_type": "technical",
     "question_text": "Explain the difference between precision and recall. When would you optimize for one over the other?",
     "expected_answer": "Precision = TP/(TP+FP), Recall = TP/(TP+FN). Optimize precision when false positives are costly (spam filter). Optimize recall when false negatives are costly (cancer detection).",
     "key_concepts": ["precision", "recall", "F1 score", "confusion matrix", "trade-off"],
     "hints": {"hint1": "Think about the cost of false positives vs false negatives."}},

    # ── DevOps ───────────────────────────────────────────────────────────
    {"domain": "DevOps", "difficulty": 5, "question_type": "technical",
     "question_text": "What is Docker and how is it different from a virtual machine?",
     "expected_answer": "Docker uses OS-level containerization sharing the host kernel; VMs emulate full hardware with a hypervisor. Containers are faster, lighter, and more portable than VMs.",
     "key_concepts": ["container", "virtual machine", "hypervisor", "kernel", "image", "Dockerfile"],
     "hints": {"hint1": "Think about the layers: hardware → OS → hypervisor vs container engine."}},

    {"domain": "DevOps", "difficulty": 6, "question_type": "technical",
     "question_text": "Explain the CI/CD pipeline. What stages would you include in a production-grade pipeline?",
     "expected_answer": "Stages: code commit → build → unit tests → integration tests → security scan → staging deploy → smoke tests → production deploy. Include rollback strategy.",
     "key_concepts": ["CI/CD", "build", "test", "deploy", "rollback", "blue-green deployment"],
     "hints": {"hint1": "Think about shift-left testing principles."}},
]


async def seed():
    async with AsyncSession(engine) as db:
        # Check if already seeded
        result = await db.execute(text("SELECT COUNT(*) FROM questions"))
        count = result.scalar()
        if count > 0:
            print(f"Questions table already has {count} rows. Skipping seed.")
            return

        inserted = 0
        for q in QUESTIONS:
            import json
            await db.execute(text("""
                INSERT INTO questions (id, domain, difficulty, question_type, question_text,
                    expected_answer, key_concepts, hints, is_active, usage_count)
                VALUES (:id, :domain, :difficulty, :question_type, :question_text,
                    :expected_answer, :key_concepts, :hints, 1, 0)
            """), {
                "id": uuid.uuid4().hex,
                "domain": q["domain"],
                "difficulty": q["difficulty"],
                "question_type": q["question_type"],
                "question_text": q["question_text"],
                "expected_answer": q.get("expected_answer", ""),
                "key_concepts": json.dumps(q.get("key_concepts", [])),
                "hints": json.dumps(q.get("hints", {})),
            })
            inserted += 1

        await db.commit()
        print(f"[OK] Seeded {inserted} questions into the database.")


if __name__ == "__main__":
    asyncio.run(seed())
