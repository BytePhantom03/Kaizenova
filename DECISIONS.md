# Architectural Decisions Log

This document tracks all major non-obvious architectural decisions for Kaizenova.

## ADR-001: Async SQLAlchemy over sync
Date: 2026-06-24
Status: Accepted
Context: FastAPI is async-first; sync SQLAlchemy blocks the event loop under load.
Decision: Use `asyncpg` driver + SQLAlchemy 2.0 async session.
Consequences: All repository methods must be `async def`. Slightly more complex testing setup.
