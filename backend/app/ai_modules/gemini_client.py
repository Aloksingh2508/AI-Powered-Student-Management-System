import json
import logging
from typing import List, Dict, Optional
import google.generativeai as genai
import openai

from backend.app.config import settings

logger = logging.getLogger(__name__)

# Configure APIs if keys are available
has_gemini = False
has_openai = False

if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        has_gemini = True
    except Exception as e:
        logger.error(f"Error configuring Gemini: {e}")

if settings.OPENAI_API_KEY:
    try:
        openai.api_key = settings.OPENAI_API_KEY
        has_openai = True
    except Exception as e:
        logger.error(f"Error configuring OpenAI: {e}")


def query_llm(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Universal query helper with fallback chain."""
    if has_gemini:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini error: {e}. Falling back to OpenAI.")

    if has_openai:
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI error: {e}. Falling back to procedural system.")

    return None

# --- Academic Coach ---
def generate_performance_coach(student_name: str, marks: List[Dict]) -> str:
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    sys_ins = "You are an expert academic coach. Analyze these subject grades and suggest action steps."
    prompt = f"Analyze performance of student '{student_name}'. Marks: {marks_summary}."
    
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    # Fallback
    weak = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) < 60]
    strong = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) >= 80]
    
    coach = f"Hello {student_name}! Based on your current grades, "
    if strong:
        coach += f"your command over {', '.join(strong)} is outstanding. You should maintain this high momentum. "
    if weak:
        coach += f"However, you should allocate more daily review time to {', '.join(weak)} where you face minor concept blocks. Set aside 30 minutes for active practice in these areas."
    else:
        coach += "you display consistent performance across all courses. Keep up the disciplined work!"
    return coach

# --- Career Recommendations ---
def generate_career_recommendations(student_name: str, marks: List[Dict], interests: str = "") -> str:
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    sys_ins = "You are a professional EdTech career counselor. Provide 3 tailored career recommendations with 'Why' explanations."
    prompt = f"Student: {student_name}. Marks: {marks_summary}. Expressed interests: {interests}."
    
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    # Fallback
    best_subjects = [m['subject_name'].lower() for m in marks if (m['marks_obtained']/m['max_marks']*100) >= 70]
    
    rec = f"### Personalized Career Recommendations for {student_name}\n\n"
    if any("math" in s or "physics" in s for s in best_subjects):
        rec += "1. **Software Engineer / Data Scientist**\n"
        rec += "   - *Why*: Strong analytical capacity in Mathematics. High aptitude for programming algorithms.\n\n"
        rec += "2. **Chartered Accountant (CA)**\n"
        rec += "   - *Why*: Advanced data modeling and mathematical capabilities.\n\n"
    elif any("science" in s or "bio" in s or "chem" in s for s in best_subjects):
        rec += "1. **Doctor / Medical Professional**\n"
        rec += "   - *Why*: High affinity towards life sciences and organic systems.\n\n"
        rec += "2. **Biotechnology Researcher**\n"
        rec += "   - *Why*: Promising alignment with scientific testing and medical engineering.\n\n"
    else:
        rec += "1. **Civil Services & Management**\n"
        rec += "   - *Why*: Balanced academic generalist background matching administrative services requirements.\n\n"
        rec += "2. **Corporate Communications Manager**\n"
        rec += "   - *Why*: Strong linguistic competence and overall conceptual mastery.\n\n"
    return rec

# --- Teacher Remarks ---
def generate_teacher_comment(student_name: str, marks: List[Dict]) -> str:
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    sys_ins = "You are a classroom teacher writing a report card remark (1-2 sentences). Make it encouraging and specific."
    prompt = f"Student: {student_name}. Marks: {marks_summary}."
    
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    avg = sum([m['marks_obtained'] for m in marks]) / sum([m['max_marks'] for m in marks]) * 100 if marks else 0
    if avg >= 85:
        return f"{student_name} displays excellent analytical capacity and has been a leader in classroom discussions this term."
    elif avg >= 60:
        return f"{student_name} has shown steady growth and regular participation. Focusing on homework exercises will yield higher results next term."
    else:
        return f"{student_name} has faced concepts struggles this term. Structured tutorials and regular revision are recommended to build confidence."

# --- Parent Report Card Summary ---
def generate_parent_report(student_name: str, marks: List[Dict], attendance: float) -> str:
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    sys_ins = "You are an empathetic principal explaining a student's grades to parents. Keep it simple, friendly, and non-technical."
    prompt = f"Student: {student_name}. Marks: {marks_summary}. Attendance: {attendance:.1f}%."
    
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    # Fallback
    avg = sum([m['marks_obtained'] for m in marks]) / sum([m['max_marks'] for m in marks]) * 100 if marks else 0
    status = "excellent" if avg >= 85 else ("very stable" if avg >= 60 else "needing additional assistance")
    
    rep = f"Dear Parents,\n\nWe are pleased to report that {student_name}'s performance this semester is {status} with a term average score of {avg:.1f}%. "
    rep += f"Their attendance stands at {attendance:.1f}%. "
    if attendance < 75:
        rep += "Please note that attendance is crucial; regular school attendance will help them catch up on lessons and clarify questions immediately."
    else:
        rep += "Their consistent presence in class shows in their strong subject engagement."
    return rep

# --- Scholarship Suggestion ---
def generate_scholarship_recommendation(student_name: str, percentage: float, category: str) -> List[Dict]:
    """Find matching scholarships."""
    # We can fetch default scholarships and let Gemini sort, or construct a list
    scholarships = [
        {"name": "Lumina Academic Merit Scholarship", "min_pct": 90.0, "category": "All", "amount": 5000.0, "desc": "Awarded to elite scorers scoring above 90% in final examinations."},
        {"name": "EduMind Opportunity Scholarship", "min_pct": 75.0, "category": "OBC", "amount": 3000.0, "desc": "Financial assistance for OBC category students with good records."},
        {"name": "Struggling Talents Education Aid", "min_pct": 60.0, "category": "SC", "amount": 4000.0, "desc": "Aid forSC category students supporting technical learning courses."},
        {"name": "Tech Talents Inclusion Fellowship", "min_pct": 80.0, "category": "ST", "amount": 4500.0, "desc": "Fostering STEM engineering pursuits among SC/ST category students."}
    ]
    
    matches = []
    for s in scholarships:
        if percentage >= s['min_pct'] and (s['category'] == "All" or s['category'] == category):
            matches.append(s)
            
    return matches

# --- Exam Paper Generator ---
def generate_exam_paper(subject_name: str, difficulty: str) -> dict:
    """Generate structured quiz questions (MCQs, short and long questions) in JSON format."""
    sys_ins = "You are an automated academic examiner. Return a JSON structure containing: 'mcqs' (list of dict with 'question', 'options' list of 4, 'correct'), 'short_questions' (list of 2 strings), and 'long_questions' (list of 1 string)."
    prompt = f"Generate a {difficulty} exam paper for the subject: {subject_name}. Return ONLY valid JSON format."
    
    res = query_llm(prompt, sys_ins)
    if res:
        try:
            clean_res = res.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_res)
            if "mcqs" in data and "short_questions" in data and "long_questions" in data:
                return data
        except Exception:
            pass

    # Fallback Procedural Questions
    return {
        "mcqs": [
            {
                "question": f"Which of the following is a primary core topic in {subject_name}?",
                "options": ["A) Introductory definitions", "B) Random theory", "C) Advanced unrelated study", "D) Elementary assumptions"],
                "correct": "A"
            },
            {
                "question": f"What is the main objective of evaluating {subject_name} systems?",
                "options": ["A) Data collection", "B) Analyzing logical outcomes", "C) Testing infrastructure", "D) All of the above"],
                "correct": "D"
            }
        ],
        "short_questions": [
            f"Define the baseline principles of {subject_name} and write two examples.",
            f"Explain how testing contributes to understanding concepts in {subject_name}."
        ],
        "long_questions": [
            f"Discuss the practical applications of {subject_name} in the modern workspace. Support your analysis with real-world case studies and data structures."
        ]
    }

# --- Learning Path Generator ---
def generate_learning_path(student_name: str, marks: List[Dict]) -> str:
    weak = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) < 60]
    strong = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) >= 80]
    
    sys_ins = "You are an expert learning pathways designer. Outline a structured 4-step roadmap with topics, time allocations, and milestones."
    prompt = f"Generate learning pathway for student '{student_name}'. Strengths: {', '.join(strong)}. Focus areas: {', '.join(weak)}."
    
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    # Fallback
    path = f"### 🗺️ Custom Academic Roadmap for {student_name}\n\n"
    if weak:
        path += f"#### Step 1: Foundational Strengthening in **{', '.join(weak)}**\n"
        path += "- **Milestone**: Re-study core chapters 1-4 and complete basic quiz reviews.\n"
        path += "- **Timeline**: Weeks 1-3 (Allocating 45m daily).\n\n"
        path += "#### Step 2: Practice Sheets & Quizzes\n"
        path += "- **Milestone**: Complete 5 textbook practice sets.\n"
        path += "- **Timeline**: Weeks 4-5.\n\n"
    else:
        path += "#### Step 1: Advanced Command Development\n"
        path += "- **Milestone**: Study high-level reference concepts and Olympiad mock sheets.\n"
        path += "- **Timeline**: Weeks 1-3.\n\n"
        
    path += f"#### Step 3: Peer Collaboration & Tutoring\n"
    path += "- **Milestone**: Lead a study group or explain complex topics to classmates.\n"
    path += "- **Timeline**: Weeks 6-8.\n\n"
    path += "#### Step 4: Full Semester Review\n"
    path += "- **Milestone**: Achieve above 80% on mock review sheets before exam week.\n"
    path += "- **Timeline**: Week 9 onward."
    return path

# --- Doubt Solving Chatbot ---
def generate_doubt_reply(query: str, context: str, history: Optional[List[Dict]] = None) -> str:
    sys_ins = "You are 'EduMind Advisor', an intelligent EdTech chatbot doubt solver. Answer academic questions, career queries, and grade questions based on student context. Keep replies clear and under 3 paragraphs."
    
    history_str = ""
    if history:
        for msg in history[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            history_str += f"{role}: {msg.get('content')}\n"
            
    prompt = f"Context:\n{context}\n\nChat History:\n{history_str}\nUser Question: {query}"
    res = query_llm(prompt, sys_ins)
    if res:
        return res
        
    # Fallback
    q = query.lower()
    if "math" in q:
        return "To master Mathematics, practice derivation steps and solve at least 3 problems daily. Let me know if you want a detailed math study plan!"
    elif "career" in q or "job" in q:
        return "We recommend exploring Tech roles (Software Engineering/Data Science) if your math scores are strong, or Public Services if you enjoy social sciences. What subjects do you find most interesting?"
    elif "rank" in q or "grade" in q:
        return f"According to your records:\n{context}\nCheck out the main report card tab for details."
    return "Hello! I can help you solve doubts, build study pathways, or plan your next semester. Ask me anything about your courses!"

# --- Digital Academic Twin ---
def generate_digital_twin(student_name: str, marks: List[Dict], attendance: float) -> dict:
    """Create a profile detailing learning properties."""
    # Features calculations
    avg = sum([m['marks_obtained'] for m in marks]) / sum([m['max_marks'] for m in marks]) * 100 if marks else 70.0
    
    strong = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) >= 80]
    weak = [m['subject_name'] for m in marks if (m['marks_obtained']/m['max_marks']*100) < 60]
    
    # Speed properties
    if avg >= 85:
        speed = "Fast Learner (High visual and logical association capacity)"
        retention = "High (90%+ long-term retention rate)"
    elif avg >= 60:
        speed = "Moderate Learner (Progresses well with structured instruction)"
        retention = "Average (70% retention, requires weekly reviews)"
    else:
        speed = "Deliberate Learner (Gains mastery through targeted peer support and reviews)"
        retention = "Requires reinforcement (needs flashcards and active recall)"

    return {
        "student_name": student_name,
        "learning_speed": speed,
        "retention_rate": retention,
        "strong_subjects": strong if strong else ["Consistent basic command across subjects"],
        "weak_subjects": weak if weak else ["No major concept blockages"],
        "academic_growth_trend": "Improving" if avg >= 75 else ("Stable" if avg >= 55 else "Declining"),
        "career_potential": "Software Developer, Data Analyst, Scientist" if any("math" in s.lower() or "science" in s.lower() for s in strong) else "Administrator, Educator, Legal Advisor"
    }
