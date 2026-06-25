Write-Host "Starting Kaizenova Servers Locally..." -ForegroundColor Cyan

# Start Backend
Write-Host "Booting FastAPI Backend and Migrating DB..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; alembic upgrade head; uvicorn app.main:app --reload --port 8000"


# Start Frontend
Write-Host "Booting Next.js Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All processes have been launched in separate windows!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:3000"
