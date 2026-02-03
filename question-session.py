#!/usr/bin/env python3
"""Interactive question session for research direction exploration."""

import json
from pathlib import Path
from datetime import datetime

QUESTIONS = [
    # Section 1: Scope & Framing
    ("Scope & Framing", "Which factor is primary? Are monitoring, mental model, and intent communication equally weighted, or does one underlie the others?"),
    ("Scope & Framing", "What's the relationship between R4 (fine-grained intent) and R5 (easy intent)? Is fine-grained control fundamentally at odds with ease of use?"),
    ("Scope & Framing", "Is 'appropriate reliance' a stable target? Should it vary by task type (brainstorming vs. polishing vs. professional writing)?"),
    ("Scope & Framing", "What distinguishes writing from other AI-assisted tasks? Why does reliance matter more (or differently) here?"),

    # Section 2: Self-Monitoring (R1)
    ("Self-Monitoring (R1)", "What granularity of monitoring helps? Word-level? Paragraph-level? Session-level? Idea-level?"),
    ("Self-Monitoring (R1)", "When do users actually want to review contribution history? What triggers that need?"),
    ("Self-Monitoring (R1)", "Does awareness of reliance change behavior? Or do users just feel guilty without acting differently?"),
    ("Self-Monitoring (R1)", "How do we balance transparency with cognitive burden? History is valuable but heavy."),
    ("Self-Monitoring (R1)", "What makes interpretability actionable? Knowing 'AI wrote 60%' - then what?"),

    # Section 3: Agency & Mental Model (R2, R3)
    ("Agency & Mental Model (R2, R3)", "Can AI 'say no' without frustrating users? What framing makes pushback acceptable?"),
    ("Agency & Mental Model (R2, R3)", "How do we detect when a user needs 'void for thinking' vs. genuine assistance?"),
    ("Agency & Mental Model (R2, R3)", "Can we scaffold the knowledge-telling to knowledge-transforming transition? Or is that beyond tool design?"),
    ("Agency & Mental Model (R2, R3)", "What do expert writers do differently with AI suggestions? How do they 'refine' rather than 'accept'?"),
    ("Agency & Mental Model (R2, R3)", "Should the system adapt its intervention level based on user expertise? How do we assess expertise?"),

    # Section 4: Intent Communication (R4, R5)
    ("Intent Communication (R4, R5)", "What are the most common misalignments? Tone? Structure? Depth? Word choice? Voice?"),
    ("Intent Communication (R4, R5)", "What UI primitives are missing? Sliders? Constraints? Examples? Comparison views?"),
    ("Intent Communication (R4, R5)", "Is the problem input (expressing intent) or output (interpreting AI response)? Or both?"),
    ("Intent Communication (R4, R5)", "How much specification is too much? When does conveying intent become more work than writing?"),

    # Section 5: Design Trade-offs
    ("Design Trade-offs", "Who is the target user? Can one system serve both novice and expert writers?"),
    ("Design Trade-offs", "Is Prism the right testbed? Does its interaction model constrain or enable your explorations?"),
    ("Design Trade-offs", "What's the evaluation metric for 'appropriate reliance'? (quality, satisfaction, learning, ownership, engagement)"),
    ("Design Trade-offs", "What's the minimal intervention that shifts reliance patterns? Full redesign or small nudges?"),

    # Section 6: Your Contribution
    ("Your Contribution", "Which R (R1-R5) will you focus on? Or will you address interactions between multiple factors?"),
    ("Your Contribution", "What's the novel claim? What hasn't been said in prior work on AI-assisted writing?"),
    ("Your Contribution", "What artifact will you build? A new interface? A measurement tool? A design framework?"),
    ("Your Contribution", "What study design will validate your claims? Lab study? Longitudinal? Think-aloud?"),
]

ANSWERS_FILE = Path("/Users/dolsoon/deep-writer2/my-answers.json")

def load_answers():
    if ANSWERS_FILE.exists():
        return json.loads(ANSWERS_FILE.read_text())
    return {}

def save_answers(answers):
    ANSWERS_FILE.write_text(json.dumps(answers, indent=2, ensure_ascii=False))

def clear_screen():
    print("\033[2J\033[H", end="")

def print_header(section, q_num, total):
    print("=" * 60)
    print(f"  Section: {section}")
    print(f"  Question {q_num} of {total}")
    print("=" * 60)
    print()

def print_help():
    print("\n  Commands:")
    print("    [Enter]      - Save answer and continue")
    print("    'skip' or 's' - Skip to next question")
    print("    'back' or 'b' - Go to previous question")
    print("    'jump N'      - Jump to question N")
    print("    'list' or 'l' - Show all questions")
    print("    'save'        - Save and exit")
    print("    'quit' or 'q' - Quit without saving current")
    print("    'help' or 'h' - Show this help")
    print()

def print_question_list(answers):
    clear_screen()
    print("=" * 60)
    print("  ALL QUESTIONS")
    print("=" * 60)
    current_section = ""
    for i, (section, q) in enumerate(QUESTIONS, 1):
        if section != current_section:
            print(f"\n  [{section}]")
            current_section = section
        status = "v" if str(i) in answers and answers[str(i)].strip() else " "
        q_short = q[:50] + "..." if len(q) > 50 else q
        print(f"    [{status}] {i:2}. {q_short}")
    print("\n  Press Enter to continue...")
    input()

def run_session():
    answers = load_answers()
    idx = 0
    total = len(QUESTIONS)

    clear_screen()
    print("\n  Welcome to Research Question Session")
    print("  ====================================")
    print(f"\n  {total} questions to explore.")
    print("  Your answers auto-save to: my-answers.json")
    print("\n  Type 'help' anytime for commands.")
    print("\n  Press Enter to begin...")
    input()

    while 0 <= idx < total:
        section, question = QUESTIONS[idx]
        q_key = str(idx + 1)

        clear_screen()
        print_header(section, idx + 1, total)

        print(f"  Q: {question}\n")

        if q_key in answers and answers[q_key].strip():
            print(f"  [Previous answer]")
            print(f"  {answers[q_key]}\n")
            print("  (Type new answer to replace, or press Enter to keep)")

        print("-" * 60)

        try:
            user_input = input("  Your thoughts: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n  Saving and exiting...")
            save_answers(answers)
            break

        # Handle commands
        cmd = user_input.lower()

        if cmd in ('help', 'h'):
            print_help()
            input("  Press Enter to continue...")
            continue

        if cmd in ('skip', 's'):
            idx += 1
            continue

        if cmd in ('back', 'b'):
            idx = max(0, idx - 1)
            continue

        if cmd.startswith('jump '):
            try:
                target = int(cmd.split()[1]) - 1
                if 0 <= target < total:
                    idx = target
                else:
                    print(f"  Invalid question number. Use 1-{total}")
                    input("  Press Enter to continue...")
            except (ValueError, IndexError):
                print("  Usage: jump N (e.g., jump 5)")
                input("  Press Enter to continue...")
            continue

        if cmd in ('list', 'l'):
            print_question_list(answers)
            continue

        if cmd == 'save':
            save_answers(answers)
            print("\n  Answers saved! Exiting...")
            break

        if cmd in ('quit', 'q'):
            print("\n  Exiting without saving current question...")
            break

        # Save answer if provided (or keep previous)
        if user_input:
            answers[q_key] = user_input
            save_answers(answers)

        idx += 1

    # End of session
    if idx >= total:
        clear_screen()
        print("\n  Session Complete!")
        print("  =================")
        answered = sum(1 for k, v in answers.items() if v.strip())
        print(f"\n  You answered {answered} of {total} questions.")
        print(f"  Answers saved to: my-answers.json")
        print("\n  Run this script again anytime to continue or revise.")
        save_answers(answers)

if __name__ == "__main__":
    run_session()
