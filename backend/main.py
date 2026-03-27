from typing import List
from pydantic import BaseModel

SESSION_MEMORY = []
MAX_MEMORY = 10

USER_PROFILE = {
    "vata": None,
    "pitta": None,
    "kapha": None,
    "dominant": None
}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq   
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatRequest(BaseModel):
    message: str


class DoshaProfileRequest(BaseModel):
    answers: List[str]

LIFESTYLE_KEYWORDS = {
    "sleep": ["sleep", "late", "night", "2am", "insomnia"],
    "digestion": ["bloating", "gas", "acid", "indigestion", "agni"],
    "diet": ["food", "diet", "cold", "spicy", "heavy"],
    "stress": ["stress", "anxiety", "worry", "tension"],
    "routine": ["routine", "dinacharya", "habit", "schedule"]
}

DOSHA_KEYWORDS = {
    "Vata": ["anxiety", "dry", "constipation", "insomnia", "restless", "late", "cold", "gas", "bloating"],
    "Pitta": ["acid", "burning", "anger", "heat", "inflammation", "rash", "spicy", "sweating"],
    "Kapha": ["heavy", "lazy", "sluggish", "weight", "mucus", "slow", "sleepy", "overeating"]
}

POSITIVE_CLAIMS = {
    "early_sleep": ["sleep early", "before 10", "early bedtime"],
    "dinacharya": ["dinacharya", "daily routine", "regular routine"],
    "healthy_diet": ["healthy diet", "balanced food", "satvik food"]
}

NEGATIVE_HABITS = {
    "late_sleep": ["sleep at 2am", "late night", "sleep late"],
    "irregular_routine": ["skip breakfast", "no routine", "irregular"],
    "junk_food": ["junk", "fast food", "fried food"]
}


def build_memory_context():
    if not SESSION_MEMORY:
        return "No prior user context available."

    memory_lines = []
    for item in SESSION_MEMORY:
        prefix = "What-if scenario" if item["type"] == "what_if" else "User query"
        memory_lines.append(f"{prefix}: {item['content']}")

    return "\n".join(memory_lines)


def analyze_lifestyle_drift():
    drift_counts = {key: 0 for key in LIFESTYLE_KEYWORDS}

    for item in SESSION_MEMORY:
        text = item["content"].lower()
        for category, keywords in LIFESTYLE_KEYWORDS.items():
            if any(word in text for word in keywords):
                drift_counts[category] += 1

    insights = []
    for category, count in drift_counts.items():
        if count >= 2:
            insights.append(f"Recurring focus on {category}-related habits")

    return insights


def estimate_dosha_trend():
    dosha_counts = {d: 0 for d in DOSHA_KEYWORDS}

    for item in SESSION_MEMORY:
        text = item["content"].lower()
        for dosha, words in DOSHA_KEYWORDS.items():
            if any(w in text for w in words):
                dosha_counts[dosha] += 1

    dominant = max(dosha_counts, key=dosha_counts.get)
    return dominant if dosha_counts[dominant] >= 2 else None


def detect_contradictions():
    positives = set()
    negatives = set()

    for item in SESSION_MEMORY:
        text = item["content"].lower()

        for k, words in POSITIVE_CLAIMS.items():
            if any(w in text for w in words):
                positives.add(k)

        for k, words in NEGATIVE_HABITS.items():
            if any(w in text for w in words):
                negatives.add(k)

    contradictions = []

    if "early_sleep" in positives and "late_sleep" in negatives:
        contradictions.append("Early sleep routine mentioned earlier conflicts with later late-night sleep.")

    if "dinacharya" in positives and "irregular_routine" in negatives:
        contradictions.append("Claimed dinacharya conflicts with later irregular routine.")

    if "healthy_diet" in positives and "junk_food" in negatives:
        contradictions.append("Healthy diet claim conflicts with later junk food mention.")

    return contradictions


@app.post("/dosha-profile")
def dosha_profile(request: DoshaProfileRequest):

    vata = request.answers.count("vata")
    pitta = request.answers.count("pitta")
    kapha = request.answers.count("kapha")

    total = vata + pitta + kapha

    vata_percent = round((vata/total)*100)
    pitta_percent = round((pitta/total)*100)
    kapha_percent = round((kapha/total)*100)

    dominant = max(
        {"Vata": vata_percent, "Pitta": pitta_percent, "Kapha": kapha_percent},
        key=lambda x: {"Vata": vata_percent, "Pitta": pitta_percent, "Kapha": kapha_percent}[x]
    )

    USER_PROFILE["vata"] = vata_percent
    USER_PROFILE["pitta"] = pitta_percent
    USER_PROFILE["kapha"] = kapha_percent
    USER_PROFILE["dominant"] = dominant

    return {
        "vata": vata_percent,
        "pitta": pitta_percent,
        "kapha": kapha_percent,
        "dominant": dominant
    }


@app.post("/chat")
def chat(request: ChatRequest):

    SESSION_MEMORY.append({
        "type": "chat",
        "content": request.message
    })

    if len(SESSION_MEMORY) > MAX_MEMORY:
        SESSION_MEMORY.pop(0)

    memory_context = build_memory_context()
    drift_insight = analyze_lifestyle_drift()

    dosha_trend = estimate_dosha_trend()
    contradictions = detect_contradictions()

    profile_context = ""

    if USER_PROFILE["dominant"]:
        profile_context = f"""
User Ayurvedic Constitution:
Vata: {USER_PROFILE["vata"]}%
Pitta: {USER_PROFILE["pitta"]}%
Kapha: {USER_PROFILE["kapha"]}%

Tailor lifestyle suggestions accordingly.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  
        messages=[
            {
                "role": "system",
                "content": f"""
You are VedaMind AI, an advanced Ayurvedic reasoning and lifestyle intelligence system.

{profile_context}

Recent user interaction history:
{memory_context}

Lifestyle pattern insight:
{drift_insight}

Instructions:

1. If the user asks about health, lifestyle habits, symptoms, dosha imbalance, agni, sleep, diet, or disease risk:
   Respond using this structured format:

   Ayurvedic Perspective:
   Root Cause Analysis:
   Short-Term Impact:
   Long-Term Impact:
   Preventive Insight:
   Confidence Level:

   Keep sections concise and clearly separated.
   Do not use markdown symbols like **.

2. If the user asks general informational questions,
   respond naturally without forcing the above structure.

3. If the user asks unrelated topics,
   answer clearly and naturally.

General Rules:
- Use short paragraphs.
- Avoid markdown symbols.
- Do not prescribe medicines.
- Maintain professional tone.
- Use prior context only when relevant.
"""
            },
            {
                "role": "user",
                "content": request.message
            }
        ],
        temperature=0.7,
        max_tokens=1200
    )

    return {
        "response": response.choices[0].message.content,
        "dosha_trend": dosha_trend,
        "lifestyle_patterns": drift_insight,
        "contradictions": contradictions
    }


@app.post("/simulate")
def simulate(request: ChatRequest):

    SESSION_MEMORY.append({
        "type": "what_if",
        "content": request.message
    })

    if len(SESSION_MEMORY) > MAX_MEMORY:
        SESSION_MEMORY.pop(0)

    memory_context = build_memory_context()
    drift_insight = analyze_lifestyle_drift()
    dosha_trend = estimate_dosha_trend()

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile", 
        messages=[
            {
                "role": "system",
                "content": f"""
You are VedaMind AI in Simulation Mode.

Recent user interaction history:
{memory_context}

Lifestyle pattern insight:
{drift_insight}

Important Rule: Reality Check

If the user's scenario is biologically impossible, extremely dangerous, or unrealistic 
(for example: not sleeping for 1 month, not drinking water for weeks, surviving without food for months):

1. First explain clearly that the scenario is not realistically survivable.
2. Briefly explain what would actually happen medically.
3. Do NOT continue with the 7 days / 3 months / 1 year template in such cases.

Only use the simulation structure when the scenario is realistic.

For realistic lifestyle scenarios use this structure:

If This Continues for 7 Days:
Explain short-term dosha effect.

If This Continues for 3 Months:
Explain deeper imbalance trend.

If This Continues for 1 Year:
Explain long-term trajectory.

Ayurvedic Correction:
Suggest corrective action.

Rules:
- Keep it interesting and visual
- Use simple language
- Avoid markdown symbols
- Do not diagnose disease
- Do not prescribe medicines
"""
            },
            {
                "role": "user",
                "content": request.message
            }
        ],
        temperature=0.8,
        max_tokens=1200
    )

    return {
        "response": response.choices[0].message.content,
        "dosha_trend": dosha_trend,
        "lifestyle_patterns": drift_insight
    }