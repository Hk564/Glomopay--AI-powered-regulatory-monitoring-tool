from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Union
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="Regulatory Monitoring API - Layer 1: Data Ingestion")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic Models
class RegulatoryUpdate(BaseModel):
    title: str = Field(..., min_length=1, description="Title of the regulatory update")
    url: str = Field(..., description="URL of the regulatory update (must be unique)")
    source: str = Field(..., description="Source of the update (e.g., RBI, SEBI)")
    published_at: Optional[str] = Field(None, description="Publication date (ISO format or string)")
    summary: Optional[str] = Field(None, description="Brief summary of the update")
    raw_content: Optional[str] = Field(None, description="Full content for AI processing")

class RegulatoryUpdateBatch(BaseModel):
    updates: List[RegulatoryUpdate]

class RegulatoryUpdateResponse(BaseModel):
    id: str
    title: str
    url: str
    source: str
    published_at: Optional[str]
    summary: Optional[str]
    raw_content: Optional[str]
    created_at: str
    is_processed: bool

class IngestResponse(BaseModel):
    success: bool
    message: str
    inserted_count: int
    duplicate_count: int
    failed_count: int
    details: List[dict]

class StatsResponse(BaseModel):
    total_updates: int
    by_source: dict
    processed_count: int
    unprocessed_count: int
    recent_updates: int  # Last 24 hours


# Helper Functions
def parse_date(date_str: Optional[str]) -> Optional[str]:
    """Parse and normalize date strings to ISO format"""
    if not date_str:
        return None
    try:
        # Try parsing ISO format
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.isoformat()
    except:
        # Return as-is if parsing fails
        return date_str


# API Endpoints

@app.get("/")
def read_root():
    return {
        "service": "Regulatory Monitoring System",
        "layer": "Layer 1: Data Ingestion",
        "status": "active",
        "endpoints": {
            "ingest_webhook": "/api/ingest",
            "manual_entry": "/api/regulatory-updates",
            "list_updates": "/api/regulatory-updates",
            "stats": "/api/stats"
        }
    }


@app.post("/api/ingest", response_model=IngestResponse, status_code=status.HTTP_200_OK)
async def ingest_data(data: Union[RegulatoryUpdate, RegulatoryUpdateBatch]):
    """
    Webhook endpoint for n8n to send regulatory updates.
    Accepts either a single update or a batch of updates.
    Handles deduplication based on URL.
    """
    updates_list = []
    
    # Handle both single and batch updates
    if isinstance(data, RegulatoryUpdateBatch):
        updates_list = data.updates
    else:
        updates_list = [data]
    
    inserted_count = 0
    duplicate_count = 0
    failed_count = 0
    details = []
    
    for update in updates_list:
        try:
            # Prepare data for insertion
            update_data = {
                "id": str(uuid.uuid4()),
                "title": update.title,
                "url": update.url,
                "source": update.source,
                "published_at": parse_date(update.published_at),
                "summary": update.summary,
                "raw_content": update.raw_content,
                "created_at": datetime.utcnow().isoformat(),
                "is_processed": False
            }
            
            # Insert into Supabase
            result = supabase.table("regulatory_updates").insert(update_data).execute()
            
            inserted_count += 1
            details.append({
                "url": update.url,
                "status": "inserted",
                "id": update_data["id"]
            })
            
        except Exception as e:
            error_msg = str(e)
            
            # Check if it's a duplicate (unique constraint violation)
            if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
                duplicate_count += 1
                details.append({
                    "url": update.url,
                    "status": "duplicate",
                    "message": "URL already exists in database"
                })
            else:
                failed_count += 1
                details.append({
                    "url": update.url,
                    "status": "failed",
                    "error": error_msg
                })
    
    return IngestResponse(
        success=True,
        message=f"Processed {len(updates_list)} updates",
        inserted_count=inserted_count,
        duplicate_count=duplicate_count,
        failed_count=failed_count,
        details=details
    )


@app.post("/api/regulatory-updates", status_code=status.HTTP_201_CREATED)
async def create_manual_update(update: RegulatoryUpdate):
    """
    Manual data entry endpoint.
    Allows manual addition of regulatory updates.
    """
    try:
        update_data = {
            "id": str(uuid.uuid4()),
            "title": update.title,
            "url": update.url,
            "source": update.source,
            "published_at": parse_date(update.published_at),
            "summary": update.summary,
            "raw_content": update.raw_content,
            "created_at": datetime.utcnow().isoformat(),
            "is_processed": False
        }
        
        result = supabase.table("regulatory_updates").insert(update_data).execute()
        
        return {
            "success": True,
            "message": "Regulatory update created successfully",
            "data": update_data
        }
        
    except Exception as e:
        error_msg = str(e)
        if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A regulatory update with this URL already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create update: {error_msg}"
        )


@app.get("/api/regulatory-updates")
async def get_updates(
    limit: int = 50,
    offset: int = 0,
    source: Optional[str] = None,
    is_processed: Optional[bool] = None
):
    """
    Get list of regulatory updates with optional filtering.
    Supports pagination and filtering by source and processing status.
    """
    try:
        query = supabase.table("regulatory_updates").select("*")
        
        # Apply filters
        if source:
            query = query.eq("source", source)
        if is_processed is not None:
            query = query.eq("is_processed", is_processed)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "success": True,
            "count": len(result.data),
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch updates: {str(e)}"
        )


@app.get("/api/regulatory-updates/{update_id}")
async def get_update(update_id: str):
    """
    Get a single regulatory update by ID.
    """
    try:
        result = supabase.table("regulatory_updates").select("*").eq("id", update_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Regulatory update not found"
            )
        
        return {
            "success": True,
            "data": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch update: {str(e)}"
        )


@app.delete("/api/regulatory-updates/{update_id}")
async def delete_update(update_id: str):
    """
    Delete a regulatory update by ID.
    """
    try:
        result = supabase.table("regulatory_updates").delete().eq("id", update_id).execute()
        
        return {
            "success": True,
            "message": "Regulatory update deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete update: {str(e)}"
        )


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get ingestion statistics.
    """
    try:
        # Get total count
        total_result = supabase.table("regulatory_updates").select("*", count="exact").execute()
        total_count = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
        
        # Get counts by source
        all_updates = supabase.table("regulatory_updates").select("source").execute()
        by_source = {}
        for update in all_updates.data:
            source = update.get("source", "Unknown")
            by_source[source] = by_source.get(source, 0) + 1
        
        # Get processed/unprocessed counts
        processed = supabase.table("regulatory_updates").select("*", count="exact").eq("is_processed", True).execute()
        processed_count = processed.count if hasattr(processed, 'count') else len(processed.data)
        
        unprocessed_count = total_count - processed_count
        
        # Get recent updates (last 24 hours)
        yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        recent = supabase.table("regulatory_updates").select("*", count="exact").gte("created_at", yesterday).execute()
        recent_count = recent.count if hasattr(recent, 'count') else len(recent.data)
        
        return StatsResponse(
            total_updates=total_count,
            by_source=by_source,
            processed_count=processed_count,
            unprocessed_count=unprocessed_count,
            recent_updates=recent_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify service and database connectivity.
    """
    try:
        # Test database connection
        result = supabase.table("regulatory_updates").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
