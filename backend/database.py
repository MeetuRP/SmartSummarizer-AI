from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from config import get_settings

client: AsyncIOMotorClient | None = None
summary_collection: AsyncIOMotorCollection | None = None


async def connect_to_mongo() -> None:
    global client, summary_collection

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]
    summary_collection = db["summaries"]

    await client.admin.command("ping")
    await summary_collection.create_index("created_at")


def get_summary_collection() -> AsyncIOMotorCollection:
    if summary_collection is None:
        raise RuntimeError("MongoDB is not connected.")
    return summary_collection


async def close_mongo_connection() -> None:
    global client, summary_collection

    if client is not None:
        client.close()

    client = None
    summary_collection = None
