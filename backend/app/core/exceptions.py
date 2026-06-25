from fastapi import HTTPException, status

class KaizenovaBaseException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthError(KaizenovaBaseException):
    def __init__(self, message: str = "Authentication failed", status_code: int = status.HTTP_401_UNAUTHORIZED):
        super().__init__(message, status_code)

class InterviewError(KaizenovaBaseException):
    def __init__(self, message: str = "Interview error", status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message, status_code)

class AIServiceError(KaizenovaBaseException):
    def __init__(self, message: str = "AI Service unavailable", status_code: int = status.HTTP_503_SERVICE_UNAVAILABLE):
        super().__init__(message, status_code)

class NotFoundError(KaizenovaBaseException):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", status.HTTP_404_NOT_FOUND)

class RateLimitExceeded(KaizenovaBaseException):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS)
