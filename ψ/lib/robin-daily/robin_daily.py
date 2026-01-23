#!/usr/bin/env python3
"""
Robin Daily Companion - Morning Brief & Evening Retro

Simple markdown tracking + AI analysis + Voice output

Usage:
    from robin_daily import RobinDaily

    robin = RobinDaily()
    robin.morning()   # Morning brief with voice
    robin.evening()   # Evening retro with voice
    robin.check()     # Mid-day status
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List, Dict

# Paths - using absolute paths for reliability
HOME = Path.home()
PSI_DIR = HOME / "120/Apps/X/ψ"
GOALS_DIR = PSI_DIR / "goals"
DAILY_DIR = GOALS_DIR / "daily"
WEEKLY_DIR = GOALS_DIR / "weekly"
TEMPLATE_PATH = GOALS_DIR / "templates" / "daily.md"

# Voice integration - robin-voice location
VOICE_DIR = PSI_DIR / "wealth-council" / "ψ" / "lib" / "robin-voice"


class RobinDaily:
    """Robin's daily companion - tracks goals, speaks briefs"""

    def __init__(self, use_voice: bool = True):
        self.use_voice = use_voice
        self.robin_voice = None
        self.today = datetime.now().strftime("%Y-%m-%d")

        # Ensure directories exist
        DAILY_DIR.mkdir(parents=True, exist_ok=True)
        WEEKLY_DIR.mkdir(parents=True, exist_ok=True)

    def _load_voice(self):
        """Lazy load Robin Voice"""
        if self.robin_voice is None and self.use_voice:
            import sys
            sys.path.insert(0, str(VOICE_DIR))
            from robin_voice import RobinVoice
            self.robin_voice = RobinVoice()

    def _speak(self, text: str):
        """Speak text using Robin Voice"""
        if self.use_voice:
            self._load_voice()
            # Detect language and use appropriate method
            if any('\u0e00' <= c <= '\u0e7f' for c in text):
                self.robin_voice.speak_mixed(text)
            else:
                self.robin_voice.speak(text)
            self.robin_voice.play()
        print(f"\n🗣️ Robin: {text}\n")

    def _get_daily_path(self, date: str = None) -> Path:
        """Get path to daily goals file"""
        date = date or self.today
        return DAILY_DIR / f"{date}.md"

    def _load_daily(self, date: str = None) -> Dict:
        """Load daily goals from markdown"""
        path = self._get_daily_path(date)
        if not path.exists():
            return {"goals": [], "completed": 0, "energy_am": 0, "energy_pm": 0}

        content = path.read_text()

        # Parse goals
        goals = []
        for match in re.finditer(r'- \[([ x])\] (.+)', content):
            completed = match.group(1) == 'x'
            goals.append({"text": match.group(2), "done": completed})

        # Parse energy
        energy_am = re.search(r'\*\*Energy\*\*:\s*(\d+)/10', content)
        energy_pm = re.search(r'\*\*Energy\*\*:\s*(\d+)/10.*Evening', content, re.DOTALL)

        # Parse mood
        mood_am = re.search(r'\*\*Mood\*\*:\s*(.+)', content)

        return {
            "goals": goals,
            "completed": sum(1 for g in goals if g["done"]),
            "total": len(goals),
            "energy_am": int(energy_am.group(1)) if energy_am else 0,
            "energy_pm": int(energy_pm.group(1)) if energy_pm else 0,
            "mood": mood_am.group(1).strip() if mood_am else "",
        }

    def _get_recent_stats(self, days: int = 7) -> Dict:
        """Get stats from recent days"""
        stats = {"total_goals": 0, "completed": 0, "days": 0, "streak": 0}

        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            daily = self._load_daily(date)

            if daily["goals"]:
                stats["days"] += 1
                stats["total_goals"] += daily["total"]
                stats["completed"] += daily["completed"]

                # Calculate streak
                if i == 0 or stats["streak"] == i:
                    if daily["total"] > 0 and daily["completed"] == daily["total"]:
                        stats["streak"] += 1

        if stats["total_goals"] > 0:
            stats["hit_rate"] = round(stats["completed"] / stats["total_goals"] * 100)
        else:
            stats["hit_rate"] = 0

        return stats

    def _create_today(self, goals: List[str] = None, energy: int = None, mood: str = None):
        """Create or update today's goals file"""
        path = self._get_daily_path()

        if path.exists():
            content = path.read_text()
        else:
            content = TEMPLATE_PATH.read_text().replace("{{DATE}}", self.today)

        if goals:
            # Replace goals section
            goals_md = "\n".join(f"- [ ] {g}" for g in goals)
            content = re.sub(
                r'## Goals\n(- \[[ x]\] .+\n)*',
                f"## Goals\n{goals_md}\n",
                content
            )

        if energy:
            content = re.sub(
                r'\*\*Energy\*\*: /10',
                f'**Energy**: {energy}/10',
                content,
                count=1
            )

        if mood:
            content = re.sub(
                r'\*\*Mood\*\*:.*',
                f'**Mood**: {mood}',
                content,
                count=1
            )

        path.write_text(content)
        return path

    def set_goals(self, goals: List[str], energy: int = None, mood: str = None):
        """Set today's goals"""
        self._create_today(goals, energy, mood)
        print(f"✅ Goals set for {self.today}")
        return self._load_daily()

    def complete_goal(self, index: int):
        """Mark a goal as complete"""
        path = self._get_daily_path()
        if not path.exists():
            print("❌ No goals for today")
            return

        content = path.read_text()
        goals = list(re.finditer(r'- \[ \] (.+)', content))

        if 0 < index <= len(goals):
            goal_text = goals[index - 1].group(1)
            content = content.replace(f"- [ ] {goal_text}", f"- [x] {goal_text}", 1)
            path.write_text(content)
            print(f"✅ Completed: {goal_text}")

            # Celebrate!
            daily = self._load_daily()
            if daily["completed"] == daily["total"]:
                self._speak("เย้! เธอทำครบทุก goal วันนี้แล้ว! Proud of you!")
        else:
            print(f"❌ Invalid goal index: {index}")

    def morning(self, goals: List[str] = None, energy: int = None, mood: str = None):
        """
        Morning brief - start the day right

        If goals provided, sets them. Otherwise reads existing.
        Speaks summary with motivation.
        """
        # Set goals if provided
        if goals:
            self._create_today(goals, energy, mood)

        # Load today's data
        daily = self._load_daily()
        stats = self._get_recent_stats()

        # Build morning message
        msg_parts = []

        # Greeting
        hour = datetime.now().hour
        if hour < 12:
            msg_parts.append("สวัสดีตอนเช้าค่ะเธอ!")
        else:
            msg_parts.append("สวัสดีค่ะเธอ!")

        # Goals
        if daily["goals"]:
            msg_parts.append(f"วันนี้เธอมี {daily['total']} goals:")
            for i, goal in enumerate(daily["goals"], 1):
                status = "done" if goal["done"] else "pending"
                print(f"  {i}. [{status}] {goal['text']}")
        else:
            msg_parts.append("วันนี้ยังไม่มี goals เลยนะ ตั้งเป้าหมายกันเถอะ!")

        # Stats motivation
        if stats["streak"] > 0:
            msg_parts.append(f"เธอทำครบติดต่อกัน {stats['streak']} วันแล้ว! Keep going!")
        elif stats["hit_rate"] > 0:
            msg_parts.append(f"สัปดาห์นี้ hit rate เธออยู่ที่ {stats['hit_rate']}%")

        # Speak
        full_msg = " ".join(msg_parts)
        self._speak(full_msg)

        return {"daily": daily, "stats": stats}

    def evening(self, reflection: str = None, energy: int = None, mood: str = None):
        """
        Evening retro - reflect on the day

        Analyzes what got done, provides encouragement or gentle nudge.
        """
        daily = self._load_daily()
        stats = self._get_recent_stats()

        # Update evening section
        path = self._get_daily_path()
        if path.exists():
            content = path.read_text()

            # Update completed count
            content = re.sub(
                r'\*\*Completed\*\*: /.*',
                f"**Completed**: {daily['completed']}/{daily['total']}",
                content
            )

            if energy:
                # Find the Evening section and update energy there
                evening_section = content.find("## Evening")
                if evening_section > 0:
                    before = content[:evening_section]
                    after = content[evening_section:]
                    after = re.sub(r'\*\*Energy\*\*: /10', f'**Energy**: {energy}/10', after, count=1)
                    content = before + after

            if reflection:
                content = re.sub(
                    r'\*\*Reflection\*\*:.*',
                    f'**Reflection**: {reflection}',
                    content
                )

            path.write_text(content)

        # Build evening message
        msg_parts = []

        # Greeting
        msg_parts.append("เป็นยังไงบ้างวันนี้?")

        # Results
        if daily["total"] > 0:
            pct = round(daily["completed"] / daily["total"] * 100)

            if pct == 100:
                msg_parts.append(f"เธอทำครบทุก goal! Amazing! เก่งมากเลยค่ะ!")
            elif pct >= 70:
                msg_parts.append(f"เธอทำได้ {daily['completed']} จาก {daily['total']} goals - {pct}% ดีมากเลย!")
            elif pct >= 50:
                msg_parts.append(f"เธอทำได้ {daily['completed']} จาก {daily['total']} - ไม่เป็นไรนะ พรุ่งนี้ทำต่อ!")
            else:
                msg_parts.append(f"วันนี้ทำได้ {daily['completed']} จาก {daily['total']} goals พรุ่งนี้เอาใหม่นะ ฉันเชื่อในตัวเธอ!")

            # Show what's done and pending
            done = [g["text"] for g in daily["goals"] if g["done"]]
            pending = [g["text"] for g in daily["goals"] if not g["done"]]

            if done:
                print(f"\n✅ Completed: {', '.join(done)}")
            if pending:
                print(f"⏳ Pending: {', '.join(pending)}")
        else:
            msg_parts.append("วันนี้ไม่ได้ตั้ง goals ไว้ ไม่เป็นไรนะ พรุ่งนี้ลองตั้งดู!")

        # Weekly trend
        if stats["days"] >= 3:
            if stats["hit_rate"] >= 80:
                msg_parts.append(f"สัปดาห์นี้เธอ consistent มาก - {stats['hit_rate']}% hit rate!")
            elif stats["hit_rate"] >= 50:
                msg_parts.append(f"สัปดาห์นี้ hit rate อยู่ที่ {stats['hit_rate']}% - good progress!")

        msg_parts.append("พักผ่อนดีๆนะคะ")

        # Speak
        full_msg = " ".join(msg_parts)
        self._speak(full_msg)

        return {"daily": daily, "stats": stats}

    def check(self):
        """Mid-day status check"""
        daily = self._load_daily()

        if not daily["goals"]:
            self._speak("เธอยังไม่ได้ตั้ง goals วันนี้เลยนะ")
            return

        pending = [g for g in daily["goals"] if not g["done"]]
        done = [g for g in daily["goals"] if g["done"]]

        msg_parts = []

        if len(done) > 0:
            msg_parts.append(f"เธอทำไปแล้ว {len(done)} goals ดีมาก!")

        if len(pending) > 0:
            msg_parts.append(f"เหลืออีก {len(pending)} goals:")
            for g in pending:
                print(f"  ⏳ {g['text']}")
        else:
            msg_parts.append("เธอทำครบหมดแล้ว! เก่งมาก!")

        self._speak(" ".join(msg_parts))

        return daily

    def weekly_review(self):
        """Weekly summary and insights"""
        stats = self._get_recent_stats(7)

        # Collect daily data
        days_data = []
        for i in range(7):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            daily = self._load_daily(date)
            if daily["goals"]:
                days_data.append({"date": date, **daily})

        print("\n📊 Weekly Review")
        print("=" * 40)
        print(f"Days tracked: {stats['days']}")
        print(f"Goals completed: {stats['completed']}/{stats['total_goals']}")
        print(f"Hit rate: {stats['hit_rate']}%")
        print(f"Current streak: {stats['streak']} days")
        print("=" * 40)

        # Simple chart
        for data in reversed(days_data):
            date = data["date"][-5:]  # MM-DD
            pct = data["completed"] / data["total"] * 100 if data["total"] > 0 else 0
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            print(f"{date} [{bar}] {data['completed']}/{data['total']}")

        msg = f"สัปดาห์นี้เธอทำได้ {stats['hit_rate']}% hit rate"
        if stats["streak"] > 0:
            msg += f" และมี streak {stats['streak']} วัน"

        self._speak(msg)

        return stats


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Robin Daily Companion")
    parser.add_argument("command", nargs="?", default="check",
                        choices=["morning", "evening", "check", "weekly", "done", "goals"],
                        help="Command to run")
    parser.add_argument("args", nargs="*", help="Additional arguments")
    parser.add_argument("--no-voice", action="store_true", help="Disable voice output")
    parser.add_argument("--energy", "-e", type=int, help="Energy level 1-10")
    parser.add_argument("--mood", "-m", type=str, help="Current mood")

    args = parser.parse_args()

    robin = RobinDaily(use_voice=not args.no_voice)

    if args.command == "morning":
        goals = args.args if args.args else None
        robin.morning(goals=goals, energy=args.energy, mood=args.mood)

    elif args.command == "evening":
        reflection = " ".join(args.args) if args.args else None
        robin.evening(reflection=reflection, energy=args.energy, mood=args.mood)

    elif args.command == "check":
        robin.check()

    elif args.command == "weekly":
        robin.weekly_review()

    elif args.command == "done":
        if args.args:
            robin.complete_goal(int(args.args[0]))
        else:
            print("Usage: robin-daily done <goal_number>")

    elif args.command == "goals":
        if args.args:
            robin.set_goals(args.args, energy=args.energy, mood=args.mood)
        else:
            daily = robin._load_daily()
            if daily["goals"]:
                for i, g in enumerate(daily["goals"], 1):
                    status = "✅" if g["done"] else "⏳"
                    print(f"  {i}. {status} {g['text']}")
            else:
                print("No goals set. Usage: robin-daily goals 'goal1' 'goal2' ...")


if __name__ == "__main__":
    main()
