from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date

class RadarChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]

class InterviewReportResponse(BaseModel):
    id: UUID
    interview_id: UUID
    overall_score: float
    technical_avg: Optional[float] = None
    communication_avg: Optional[float] = None
    confidence_avg: Optional[float] = None
    completeness_avg: Optional[float] = None
    grammar_avg: Optional[float] = None
    topic_scores: Optional[Dict[str, float]] = None
    difficulty_journey: Optional[List[Dict[str, Any]]] = None
    weak_areas: List[str] = []
    strong_areas: List[str] = []
    radar_chart_data: Optional[RadarChartData] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_interviews: int
    readiness_score: float
    avg_score: float
    recent_activity: List[Dict[str, Any]]
    streak_count: int

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[date] = None

class RecommendationResponse(BaseModel):
    id: UUID
    weak_area: str
    action_plan: List[Dict[str, Any]]
    status: str
