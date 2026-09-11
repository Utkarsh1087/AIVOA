import json
import re
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("aivoa_groq")

class GroqClientManager:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.primary_model = settings.PRIMARY_LLM
        self.secondary_model = settings.SECONDARY_LLM
        self.client = None

        if self.api_key and not self.api_key.startswith("gsk_your"):
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info(f"Groq client initialized with model: {self.primary_model}")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")
        else:
            logger.info("GROQ_API_KEY not configured or placeholder detected. Smart QMS fallback engine active.")

    def generate_json(self, system_prompt: str, user_prompt: str, model_override: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Sends prompt to Groq API and parses structured JSON output.
        """
        model = model_override or self.primary_model
        
        if self.client:
            for m in [model, "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"]:
                try:
                    response = self.client.chat.completions.create(
                        model=m,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.1,
                        max_tokens=1500,
                        response_format={"type": "json_object"}
                    )
                    content = response.choices[0].message.content
                    parsed = self._clean_and_parse_json(content)
                    if parsed:
                        return parsed
                except Exception as e:
                    logger.warning(f"Groq API call error on model {m}: {e}. Trying fallback model...")
        
        return None

    def generate_text(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """
        Generates freeform text response for interactive AI assistant chat.
        """
        if self.client:
            for m in [self.primary_model, "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"]:
                try:
                    response = self.client.chat.completions.create(
                        model=m,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.4,
                        max_tokens=800
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    logger.warning(f"Groq generate_text error on {m}: {e}")
        return None

    def _clean_and_parse_json(self, raw_str: str) -> Optional[Dict[str, Any]]:
        """Strips markdown block backticks and parses JSON safely."""
        try:
            cleaned = raw_str.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
                cleaned = re.sub(r"\n?```$", "", cleaned)
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse JSON output: {e}. Raw content: {raw_str}")
            return None

groq_manager = GroqClientManager()
