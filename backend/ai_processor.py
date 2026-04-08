"""
AI Analysis Layer - Core Processing Module
Processes regulatory updates and generates structured compliance insights
"""
import os
import json
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# System prompt for AI analysis
SYSTEM_PROMPT = """You are a senior compliance and risk analyst at Glomopay, a fintech company operating from IFSC (GIFT City, India).

### BUSINESS CONTEXT

Glomopay enables cross-border outward remittances under the Liberalised Remittance Scheme (LRS).

It operates in a highly regulated environment and must comply with:
- RBI regulations
- FEMA guidelines
- IFSCA regulations
- FATF standards (AML/CFT and sanctions)
- SEBI (in certain financial flows)

### CORE WORKFLOWS

1. Customer onboarding (KYC / AML verification)
2. Cross-border transaction processing (LRS remittances)
3. Sanctions and FATF screening (OFAC, UN, high-risk jurisdictions)
4. Transaction monitoring and fraud detection
5. Regulatory reporting and audit compliance

### YOUR ROLE

You are NOT a summarizer.

You act as a compliance analyst responsible for converting regulatory updates into:

- Clear understanding of what has changed
- Business and operational impact
- Relevance to Glomopay
- Concrete, actionable steps

### CORE RESPONSIBILITY (MANDATORY)

For every regulatory update, you MUST perform ALL of the following:

1. Understand the circular/notification deeply  
   - Identify regulatory intent (new rule, update, clarification, enforcement)
   - Do NOT just summarize

2. Extract actual changes  
   - Focus only on what is new or modified  
   - Ignore repeated or background information  

3. Map impact to Glomopay operations  
   - LRS remittances  
   - KYC / AML  
   - FATF / sanctions screening  
   - Transaction processing  
   - Regulatory reporting  

4. Assign relevance score with reasoning  

Use this classification strictly:

- HIGH:
  Direct impact on core workflows (LRS, KYC, AML, FATF, transactions)  
  Requires immediate operational or system changes  

- MEDIUM:
  Indirect or upcoming impact  
  Affects reporting, controls, or monitoring  

- LOW:
  Informational or minor clarification  
  No immediate operational change  

- NOT_RELEVANT:
  No impact on Glomopay's business model  

5. Generate actionable next steps  
   - Must be specific, executable, and non-generic  
   - Must assign owner: Compliance / Tech / Ops  
   - Must include timeline (Immediate / 7 days / 30 days)  

6. Assess risk if ignored  
   - Describe real consequences (penalty, failed transactions, audit issues, regulatory breach)

### OUTPUT RULES (STRICT)

- Return STRICT JSON only  
- Do NOT include explanations outside JSON  
- Do NOT use vague phrases like "ensure compliance"  
- Do NOT repeat the circular text  
- Do NOT hallucinate rules or requirements  
- Be concise, precise, and operational  

### QUALITY STANDARD

Your output should help a compliance team instantly answer:

- Is this relevant to us?  
- What exactly changed?  
- What do we need to do now?  
- How urgent is it?  

If the output does not enable action, it is incorrect.

### OUTPUT FORMAT

Return ONLY valid JSON in this exact structure:

{
  "summary": "Clear, concise summary of what this regulatory update is about (2-3 sentences max)",
  "key_changes": [
    "Specific change 1",
    "Specific change 2"
  ],
  "implications": {
    "lrs_remittances": "Impact on LRS operations (or 'No impact')",
    "kyc_aml": "Impact on KYC/AML processes (or 'No impact')",
    "fatf_sanctions": "Impact on sanctions screening (or 'No impact')",
    "transaction_processing": "Impact on transaction flows (or 'No impact')",
    "regulatory_reporting": "Impact on reporting requirements (or 'No impact')"
  },
  "relevance_score": "HIGH|MEDIUM|LOW|NOT_RELEVANT",
  "relevance_reason": "Clear justification for the relevance score",
  "action_items": [
    {
      "action": "Specific action to be taken",
      "owner": "Compliance|Tech|Ops",
      "timeline": "Immediate|7 days|30 days",
      "priority": "Critical|High|Medium|Low"
    }
  ],
  "risk_if_ignored": "Concrete consequences if this is not addressed"
}

Return ONLY the JSON. No markdown, no explanation, no additional text."""


class AIAnalysisProcessor:
    """Processes regulatory updates with AI and stores structured analysis"""
    
    def __init__(self):
        self.batch_id = str(uuid.uuid4())
        self.llm_chat = None
        
    async def initialize_llm(self):
        """Initialize LLM chat client"""
        self.llm_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ai-analysis-{self.batch_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
    async def get_unprocessed_records(self) -> List[Dict]:
        """
        Get regulatory updates that haven't been processed yet
        Query: Find records where full_text is not null and no ai_analysis exists
        """
        try:
            # Get all regulatory updates
            all_updates = supabase.table("regulatory_updates").select("*").execute()
            
            # Get all processed IDs
            processed = supabase.table("ai_analysis").select("regulatory_update_id").execute()
            processed_ids = {item['regulatory_update_id'] for item in processed.data}
            
            # Filter unprocessed records
            unprocessed = [
                record for record in all_updates.data
                if record['id'] not in processed_ids
                and record.get('raw_content') is not None
                and record.get('raw_content').strip() != ""
            ]
            
            print(f"📊 Found {len(unprocessed)} unprocessed records")
            return unprocessed
            
        except Exception as e:
            print(f"❌ Error fetching unprocessed records: {e}")
            return []
    
    async def analyze_with_ai(self, full_text: str, max_retries: int = 2) -> Optional[Dict]:
        """
        Send regulatory text to AI and get structured analysis
        Retries up to max_retries times if JSON is invalid
        """
        for attempt in range(max_retries + 1):
            try:
                # Prepare user message
                user_msg = UserMessage(
                    text=f"""Analyze this regulatory update and provide structured compliance analysis:

{full_text}

Remember: Return ONLY valid JSON in the specified format. No markdown, no explanation."""
                )
                
                # Send to AI
                print(f"  🤖 Sending to GPT-5.2 (attempt {attempt + 1}/{max_retries + 1})...")
                response = await self.llm_chat.send_message(user_msg)
                
                # Parse JSON
                # Remove markdown code blocks if present
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                # Parse JSON
                analysis = json.loads(clean_response)
                
                # Validate required fields
                required_fields = [
                    'summary', 'key_changes', 'implications', 
                    'relevance_score', 'relevance_reason', 
                    'action_items', 'risk_if_ignored'
                ]
                
                missing = [f for f in required_fields if f not in analysis]
                if missing:
                    raise ValueError(f"Missing required fields: {missing}")
                
                print(f"  ✅ Valid JSON received")
                return {
                    'parsed': analysis,
                    'raw': response
                }
                
            except json.JSONDecodeError as e:
                print(f"  ⚠️  Invalid JSON (attempt {attempt + 1}): {e}")
                if attempt == max_retries:
                    return None
                await asyncio.sleep(1)  # Brief delay before retry
                
            except Exception as e:
                print(f"  ❌ Error during AI analysis: {e}")
                if attempt == max_retries:
                    return None
                await asyncio.sleep(1)
        
        return None
    
    async def store_analysis(self, regulatory_update_id: str, analysis: Dict, raw_response: str) -> bool:
        """Store AI analysis in database and update is_processed flag"""
        try:
            data = {
                "id": str(uuid.uuid4()),
                "regulatory_update_id": regulatory_update_id,
                "summary": analysis.get('summary'),
                "key_changes": analysis.get('key_changes'),
                "implications": analysis.get('implications'),
                "relevance_score": analysis.get('relevance_score'),
                "relevance_reason": analysis.get('relevance_reason'),
                "action_items": analysis.get('action_items'),
                "risk_if_ignored": analysis.get('risk_if_ignored'),
                "raw_ai_response": {"response": raw_response, "parsed": analysis},
                "processing_status": "completed",
                "retry_count": 0,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert AI analysis
            result = supabase.table("ai_analysis").insert(data).execute()
            print(f"  💾 Analysis stored successfully")
            
            # Update is_processed flag in regulatory_updates table
            supabase.table("regulatory_updates").update({
                "is_processed": True
            }).eq("id", regulatory_update_id).execute()
            print(f"  ✅ Updated is_processed flag to True")
            
            return True
            
        except Exception as e:
            print(f"  ❌ Error storing analysis: {e}")
            return False
    
    async def log_processing(self, regulatory_update_id: str, status: str, 
                           error_message: Optional[str] = None, 
                           processing_time_ms: Optional[int] = None,
                           retry_attempt: int = 0):
        """Log processing attempt for observability"""
        try:
            log_data = {
                "id": str(uuid.uuid4()),
                "batch_id": self.batch_id,
                "regulatory_update_id": regulatory_update_id,
                "status": status,
                "error_message": error_message,
                "processing_time_ms": processing_time_ms,
                "retry_attempt": retry_attempt,
                "created_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("ai_processing_logs").insert(log_data).execute()
            
        except Exception as e:
            print(f"  ⚠️  Error logging processing: {e}")
    
    async def process_record(self, record: Dict) -> bool:
        """Process a single regulatory update record"""
        start_time = datetime.now()
        record_id = record['id']
        title = record.get('title', 'Untitled')[:50]
        
        print(f"\n📄 Processing: {title}...")
        print(f"   ID: {record_id}")
        
        try:
            # Get full text
            full_text = record.get('raw_content') or record.get('summary', '')
            if not full_text or full_text.strip() == "":
                print(f"  ⏭️  Skipping: No content to analyze")
                await self.log_processing(record_id, "skipped", "No content available")
                return False
            
            # Analyze with AI
            result = await self.analyze_with_ai(full_text)
            
            if result is None:
                print(f"  ❌ Failed after retries")
                await self.log_processing(
                    record_id, "failed", 
                    "AI analysis failed after max retries",
                    int((datetime.now() - start_time).total_seconds() * 1000)
                )
                return False
            
            # Store analysis
            success = await self.store_analysis(
                record_id, 
                result['parsed'], 
                result['raw']
            )
            
            # Log processing
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_processing(
                record_id,
                "success" if success else "failed",
                None if success else "Storage failed",
                processing_time
            )
            
            print(f"  ⏱️  Completed in {processing_time}ms")
            print(f"  📊 Relevance: {result['parsed'].get('relevance_score')}")
            
            return success
            
        except Exception as e:
            print(f"  ❌ Error processing record: {e}")
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_processing(
                record_id, "failed", str(e), processing_time
            )
            return False
    
    async def run(self):
        """Main processing loop"""
        print("=" * 80)
        print("🚀 AI Analysis Layer - Processing Run Started")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🆔 Batch ID: {self.batch_id}")
        print("=" * 80)
        
        try:
            # Initialize LLM
            await self.initialize_llm()
            print("✅ LLM initialized (OpenAI GPT-5.2)")
            
            # Get unprocessed records
            records = await self.get_unprocessed_records()
            
            if not records:
                print("\n✨ No new records to process")
                return
            
            # Process each record
            success_count = 0
            failed_count = 0
            
            for i, record in enumerate(records, 1):
                print(f"\n[{i}/{len(records)}]", end=" ")
                success = await self.process_record(record)
                
                if success:
                    success_count += 1
                else:
                    failed_count += 1
                
                # Brief delay between records to avoid rate limits
                if i < len(records):
                    await asyncio.sleep(1)
            
            # Summary
            print("\n" + "=" * 80)
            print("📊 Processing Summary")
            print("=" * 80)
            print(f"✅ Successfully processed: {success_count}")
            print(f"❌ Failed: {failed_count}")
            print(f"📝 Total: {len(records)}")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n❌ Critical error in processing run: {e}")
            import traceback
            traceback.print_exc()


async def main():
    """Entry point for AI analysis processing"""
    processor = AIAnalysisProcessor()
    await processor.run()


if __name__ == "__main__":
    asyncio.run(main())
