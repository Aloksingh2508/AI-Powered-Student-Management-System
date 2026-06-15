import json
import logging
from typing import List, Optional, Dict
import google.generativeai as genai
import openai

from backend.config import settings

logger = logging.getLogger(__name__)

# Configure APIs if keys are available
has_gemini = False
has_openai = False

if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        has_gemini = True
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}")

if settings.OPENAI_API_KEY:
    try:
        openai.api_key = settings.OPENAI_API_KEY
        has_openai = True
    except Exception as e:
        logger.error(f"Error configuring OpenAI API: {e}")

# Helper to query LLMs
def query_llm(prompt: str, system_instruction: str = "") -> Optional[str]:
    # Try Gemini first if available
    if has_gemini:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}. Falling back to OpenAI/Procedural.")

    # Try OpenAI if available
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
            logger.error(f"OpenAI API call failed: {e}. Falling back to Procedural.")

    return None

# --- AI Feature Implementations ---

def generate_performance_analysis(student_name: str, class_name: str, semester: str, marks: List[Dict]) -> str:
    """Analyze student marks and generate personalized feedback."""
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    
    system_instruction = "You are an expert academic counselor. Analyze the student's grades and provide detailed, constructive, and encouraging feedback. Keep your review to 2-3 clear paragraphs."
    prompt = f"Analyze the academic performance of student {student_name} in {class_name} for {semester}. Marks: {marks_summary}."
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    strengths = []
    weaknesses = []
    for m in marks:
        pct = (m['marks_obtained'] / m['max_marks'] * 100) if m['max_marks'] > 0 else 0
        if pct >= 75:
            strengths.append(m['subject_name'])
        elif pct < 50:
            weaknesses.append(m['subject_name'])

    feedback = f"Overall, {student_name} displays a structured academic profile in {class_name} for {semester}. "
    if strengths:
        feedback += f"The student demonstrates strong analytical skills and academic command in {', '.join(strengths)}. They should continue to nurture these interests. "
    else:
        feedback += f"The student's performance shows consistent engagement, though there is room to build higher mastery across subjects. "
        
    if weaknesses:
        feedback += f"\n\nAttention is recommended for {', '.join(weaknesses)}, where the student faces challenges in core concepts. Focused practice and seeking clarification in these areas will yield better marks."
    else:
        feedback += "\n\nNo immediate critical weak areas were identified. Consistent practice will help maintain this high level of excellence."

    return feedback

def generate_study_recommendations(student_name: str, marks: List[Dict]) -> str:
    """Suggest study plans based on weak subjects."""
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    
    system_instruction = "You are a professional educational planner. Design a study guide and suggest practice topics and online/offline learning resources."
    prompt = f"Recommend a customized study plan and resource list for {student_name} based on these marks: {marks_summary}."
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    weakest_subject = None
    lowest_pct = 100.0
    for m in marks:
        pct = (m['marks_obtained'] / m['max_marks'] * 100) if m['max_marks'] > 0 else 0
        if pct < lowest_pct:
            lowest_pct = pct
            weakest_subject = m['subject_name']

    rec = f"### Personalized Study Plan for {student_name}\n\n"
    if weakest_subject and lowest_pct < 70:
        rec += f"**Core Focus: Improve {weakest_subject} (Current Score: {lowest_pct:.1f}%)**\n"
        rec += f"1. **Allocate Time**: Devote 45 minutes daily to {weakest_subject} concepts.\n"
        rec += "2. **Study Method**: Practice active recall and solve at least 5 textbook exercises after school.\n"
        rec += f"3. **Recommended Resources**: Khan Academy tutorials, BBC Bitesize for foundational theory, and school teacher consultation hours.\n\n"
    else:
        rec += "**Core Focus: Maintenance and Excellence**\n"
        rec += "1. **Time Management**: Devote 30 minutes to review notes daily, alternating subjects.\n"
        rec += "2. **Study Method**: Create mind maps for complex chapters and teach concepts to peers.\n"
        rec += "3. **Recommended Resources**: Advanced reference books, Olympiad papers, and educational podcasts.\n\n"

    rec += "**General Tips**:\n"
    rec += "- Set a fixed study table to build focus habits.\n"
    rec += "- Use the Pomodoro Technique (25 minutes studying, 5 minutes break)."
    return rec

def predict_fail_risk(student_name: str, marks: List[Dict]) -> Dict:
    """Predict failure risk score and give recommendations."""
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    
    system_instruction = "You are an early intervention academic bot. Evaluate the marks and return a JSON payload with: 'risk_score' (0-100), 'risk_level' ('Low' | 'Medium' | 'High'), and 'recommendations' (bullet points list)."
    prompt = f"Predict the failure risk for student {student_name} based on: {marks_summary}. Return ONLY valid JSON format."
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        try:
            # Strip markdown formatting block if returned
            clean_res = ai_response.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_res)
            if "risk_score" in data and "risk_level" in data and "recommendations" in data:
                return data
        except Exception:
            pass

    # Procedural Fallback
    failed_subjects = 0
    total_subjects = len(marks)
    risk_score = 0.0
    recs = []
    
    for m in marks:
        pct = (m['marks_obtained'] / m['max_marks'] * 100) if m['max_marks'] > 0 else 0
        if pct < 40:
            failed_subjects += 1
            risk_score += 35
        elif pct < 55:
            risk_score += 15
            
    risk_score = min(risk_score, 100.0)
    
    if risk_score >= 70:
        level = "High"
        recs = [
            "Mandatory remedial classes for failing subjects.",
            "Bi-weekly parent-teacher progress reviews.",
            "Assign a senior peer tutor for daily homework review."
        ]
    elif risk_score >= 35:
        level = "Medium"
        recs = [
            "Weekly counseling check-in to trace focus struggles.",
            "Increase practice hours on topics scoring below 60%.",
            "Establish a study group with higher-performing classmates."
        ]
    else:
        level = "Low"
        recs = [
            "Maintain current studying habits.",
            "Optional attendance at workshops for extra credit.",
            "Participate in class discussions to maintain active engagement."
        ]

    return {
        "risk_score": round(risk_score, 2),
        "risk_level": level,
        "recommendations": recs
    }

def generate_career_guidance(student_name: str, marks: List[Dict]) -> str:
    """Suggest career paths based on subject performance."""
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    
    system_instruction = "You are a career counselor. Suggest 2-3 tailored career paths based on subject performances and highlight reasons why."
    prompt = f"Provide career guidance for student {student_name} based on marks: {marks_summary}."
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    best_subjects = []
    for m in marks:
        pct = (m['marks_obtained'] / m['max_marks'] * 100) if m['max_marks'] > 0 else 0
        if pct >= 70:
            best_subjects.append(m['subject_name'])
            
    guidance = f"Based on academic profiling, here are suitable career paths for {student_name}:\n\n"
    
    has_math = any("math" in s.lower() for s in best_subjects)
    has_sci = any("science" in s.lower() or "phys" in s.lower() or "chem" in s.lower() or "bio" in s.lower() for s in best_subjects)
    has_languages = any("eng" in s.lower() or "hist" in s.lower() or "social" in s.lower() for s in best_subjects)
    
    if has_math and has_sci:
        guidance += "1. **Engineering & Tech Roles**:\n"
        guidance += "   - *Why*: Exceptional marks in Mathematics and Sciences. Perfect match for logical problem-solving fields.\n"
        guidance += "   - *Paths*: Software Engineering, Data Analysis, Mechanical/Electrical Engineering.\n\n"
    
    if any("bio" in s.lower() for s in best_subjects):
        guidance += "2. **Medical & Biotechnology Sciences**:\n"
        guidance += "   - *Why*: Strong inclination towards Biology and life systems.\n"
        guidance += "   - *Paths*: Medicine, Biochemistry, Genetic Counseling, Bioinformatics.\n\n"
        
    if has_languages:
        guidance += "3. **Communications, Law, or Journalism**:\n"
        guidance += "   - *Why*: Outstanding performance in linguistics and social sciences. Displays solid textual and reading comprehension.\n"
        guidance += "   - *Paths*: Attorney, Media Correspondent, Corporate Communications Director.\n\n"
        
    if not best_subjects:
        guidance += "1. **Business Management or General Administration**:\n"
        guidance += "   - *Why*: A broad subject balance provides a strong generalist base for project administration, management, and operations.\n\n"
        
    guidance += "*Advice*: Choose elective courses next semester that align closely with your favorite subjects to refine your path."
    return guidance

def generate_chat_response(user_query: str, student_context: str, chat_history: Optional[List[Dict]] = None) -> str:
    """Chatbot for students and teachers answering queries about performance and grades."""
    system_instruction = (
        "You are 'Antigravity Advisor', an AI Academic Assistant chatbot. "
        "Use the provided student context (grades, averages, rankings) to answer queries. "
        "Be professional, clear, concise, and helpful. Do not mention system details."
    )
    
    # Compile history
    history_str = ""
    if chat_history:
        for chat in chat_history[-6:]:
            role = "User" if chat.get("role") == "user" else "Assistant"
            history_str += f"{role}: {chat.get('content')}\n"
            
    prompt = f"Student Context:\n{student_context}\n\nChat History:\n{history_str}\nUser Query: {user_query}"
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    query_lower = user_query.lower()
    if "hello" in query_lower or "hi" in query_lower:
        return "Hello! I am your AI academic advisor. Ask me anything about grades, subjects, or study tips!"
    elif "math" in query_lower:
        return "In Mathematics, we see the need for consistent practice on algebra. Let me know if you want study resources."
    elif "grade" in query_lower or "rank" in query_lower or "marks" in query_lower:
        return f"Based on academic records: {student_context}. Please review the marks dashboard for complete details."
    else:
        return "I can help explain report cards, recommend subjects, or share tips. Try asking about specific grades or study plans!"

def generate_class_insights(class_name: str, stats: Dict, student_performances: List[Dict]) -> str:
    """Generate class-level analytical insights for teachers."""
    toppers_str = ", ".join([f"{t['name']} ({t['overall_percentage']:.1f}%)" for t in stats['toppers']])
    subj_str = ", ".join([f"{s['subject_name']}: {s['average_score']}%" for s in stats['subject_performances']])
    
    system_instruction = "You are a senior academic director. Analyze the class stats and generate an advisory report for teachers identifying trends, successes, and warning items."
    prompt = (
        f"Generate class insights for '{class_name}'.\n"
        f"Class size: {stats['total_students']}\n"
        f"Class Average: {stats['class_average']}%\n"
        f"Pass Rate: {stats['pass_rate']}%\n"
        f"Toppers: {toppers_str}\n"
        f"Subject Averages: {subj_str}"
    )
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    weakest_subj = None
    min_score = 100.0
    for s in stats['subject_performances']:
        if s['average_score'] < min_score:
            min_score = s['average_score']
            weakest_subj = s['subject_name']
            
    report = f"### Academic Insights for {class_name}\n\n"
    report += f"- **Overall Performance**: The class maintains a healthy average of **{stats['class_average']}%** with a pass rate of **{stats['pass_rate']}%**.\n"
    report += f"- **Top Performers**: High appreciation goes to {toppers_str} for outstanding semester accomplishments.\n"
    
    if weakest_subj and min_score < 65:
        report += f"- **Focus Area**: **{weakest_subj}** has the lowest class average (**{min_score}%**). Teachers are advised to conduct review sessions or revise foundational worksheets before the next term.\n"
    else:
        report += "- **Focus Area**: Class averages are stable across all subjects. Consider introduces advanced projects to challenge high-achieving students.\n"
        
    report += "- **Recommendation**: Keep tracking students with scores near 40% for early tutoring and remedial study circles."
    return report

def generate_report_card_summary(student_name: str, marks: List[Dict]) -> str:
    """Automatically generate semester performance summary comments for report cards."""
    marks_summary = ", ".join([f"{m['subject_name']}: {m['marks_obtained']}/{m['max_marks']}" for m in marks])
    
    system_instruction = "You are a class teacher writing a brief remark (1-2 sentences) for a student's report card. Make it professional, realistic, and constructive."
    prompt = f"Write teacher comments for {student_name}'s report card. Marks: {marks_summary}."
    
    ai_response = query_llm(prompt, system_instruction)
    if ai_response:
        return ai_response

    # Procedural Fallback
    avg_pct = sum([m['marks_obtained'] for m in marks]) / sum([m['max_marks'] for m in marks]) * 100 if marks else 0
    if avg_pct >= 85:
        return f"{student_name} has demonstrated excellent academic competence this semester. Their high enthusiasm and dedication are highly commendable."
    elif avg_pct >= 60:
        return f"{student_name} displays good progress and general understanding of subjects. Continued focus on weak areas will yield even better marks next semester."
    else:
        return f"{student_name} has faced academic hurdles this semester. Regular revision and dedicated tutoring support are recommended to reinforce core concepts."
