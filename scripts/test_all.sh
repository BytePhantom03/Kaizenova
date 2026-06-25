#!/bin/bash
set -e

echo "Starting Kaizenova Test Suite..."

# Backend Tests
echo "Running Backend Pytest Suite..."
cd backend
python -m pytest tests/ -v --cov=app --cov-report=term-missing

echo "All tests completed successfully!"
