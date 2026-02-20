import requests
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

def _call_openrouter(prompt, system_prompt):
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("Error: API key missing")
        return
    
    print(f"Calling AI...")
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3001",
            "X-Title": "AI Tour Planner Test"
        },
        json={
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        },
        timeout=45
    )
    
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        print(f"Raw Output: {content}")
        
        try:
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            return json.loads(content)
        except:
            return {"content": content, "error": "Parsing failed"}
    else:
        print(f"API Error: {response.text}")
        return None

text = "Where is the nearest railway station?"
target_lang = "Telugu"
prompt = f"""Translate the following text to {target_lang}: "{text}".
Strictly return ONLY a JSON object in this format:
{{
    "translated_text": "YOUR TRANSLATED TEXT HERE"
}}
Do not include any other text, warnings, or explanations."""

res = _call_openrouter(prompt, "You are a professional translator. Return raw JSON only.")
print(f"Parsed Result: {res}")
