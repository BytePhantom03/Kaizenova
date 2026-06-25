from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete as sa_delete, update as sa_update
from uuid import UUID

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T]):
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: UUID) -> Optional[T]:
        result = await db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def create(self, db: AsyncSession, data: dict[str, Any]) -> T:
        db_obj = self.model(**data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, id: UUID, data: dict[str, Any]) -> Optional[T]:
        stmt = sa_update(self.model).where(self.model.id == id).values(**data).execution_options(synchronize_session="fetch")
        await db.execute(stmt)
        await db.commit()
        return await self.get_by_id(db, id)

    async def delete(self, db: AsyncSession, id: UUID) -> bool:
        stmt = sa_delete(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0

    async def list(self, db: AsyncSession, limit: int = 100, offset: int = 0, **filters: Any) -> List[T]:
        stmt = select(self.model)
        for key, value in filters.items():
            stmt = stmt.filter(getattr(self.model, key) == value)
        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
