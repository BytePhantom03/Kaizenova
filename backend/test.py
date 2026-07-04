import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

engine = create_async_engine('sqlite+aiosqlite:///app.db')
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def main():
    async with async_session() as session:
        result = await session.execute(text("SELECT session_state FROM interviews WHERE id = '5e77e87e-bd89-48fb-8b07-ea69a50edec1'"))
        row = result.fetchone()
        if row:
            print(row[0])
        else:
            print('Interview not found')

asyncio.run(main())
