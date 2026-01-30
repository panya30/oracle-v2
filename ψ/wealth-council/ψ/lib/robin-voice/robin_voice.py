#!/usr/bin/env python3
"""
Robin Voice - Thai + English TTS with Voice Cloning

- Thai: Edge TTS (native pronunciation)
- English: XTTS v2 (voice cloning with Norah Jones)

Usage:
    from robin_voice import RobinVoice

    robin = RobinVoice()
    robin.speak("สวัสดีค่ะ", "thai.wav")      # Thai with Edge TTS
    robin.speak("Hello!", "english.wav")      # English with XTTS
    robin.play()
"""

import os
import sys
import asyncio
import re
from pathlib import Path
from typing import Optional
import subprocess

# Paths
VOICE_DIR = Path(__file__).parent / "voices"
OUTPUT_DIR = Path(__file__).parent / "output"
DEFAULT_VOICE = VOICE_DIR / "robin_reference.wav"

# Thai character detection
THAI_PATTERN = re.compile(r'[\u0e00-\u0e7f]')


class RobinVoice:
    """Hybrid TTS: Edge TTS for Thai, XTTS for English"""

    def __init__(
        self,
        reference_audio: Optional[str] = None,
        thai_voice: str = "th-TH-PremwadeeNeural",
        english_voice: str = "en-US-AriaNeural",
    ):
        """
        Initialize Robin Voice

        Args:
            reference_audio: Path to reference voice for XTTS (English)
            thai_voice: Edge TTS voice for Thai
            english_voice: Fallback Edge TTS voice for English
        """
        self.reference = reference_audio or str(DEFAULT_VOICE)
        self.thai_voice = thai_voice
        self.english_voice = english_voice
        self.tts = None  # Lazy load XTTS
        self._last_output = None

        # Ensure directories exist
        VOICE_DIR.mkdir(parents=True, exist_ok=True)
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def _is_thai(self, text: str) -> bool:
        """Detect if text contains Thai characters"""
        return bool(THAI_PATTERN.search(text))

    def _load_xtts(self):
        """Lazy load XTTS model"""
        if self.tts is None:
            print("🔄 Loading XTTS v2...")
            os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
            from TTS.api import TTS
            self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            print("✅ XTTS loaded!")

    async def _edge_tts(self, text: str, output_path: str, voice: str):
        """Generate speech using Edge TTS"""
        import edge_tts

        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

    def speak(
        self,
        text: str,
        output_path: Optional[str] = None,
        force_thai: bool = False,
        force_english: bool = False,
    ) -> str:
        """
        Generate speech from text

        Auto-detects language:
        - Thai text → Edge TTS (native)
        - English text → XTTS + voice clone (if reference exists)

        Args:
            text: Text to speak
            output_path: Output WAV file path
            force_thai: Force Thai TTS
            force_english: Force English TTS

        Returns:
            Path to generated audio file
        """
        # Generate output path
        if output_path is None:
            import time
            timestamp = int(time.time())
            output_path = str(OUTPUT_DIR / f"robin_{timestamp}.wav")

        # Detect language
        is_thai = force_thai or (not force_english and self._is_thai(text))

        if is_thai:
            return self._speak_thai(text, output_path)
        else:
            return self._speak_english(text, output_path)

    def _speak_thai(self, text: str, output_path: str) -> str:
        """Generate Thai speech using Edge TTS"""
        print(f"🇹🇭 Thai: {text[:50]}...")

        # Run async Edge TTS
        asyncio.run(self._edge_tts(text, output_path, self.thai_voice))

        self._last_output = output_path
        print(f"✅ Saved: {output_path}")
        return output_path

    def _speak_english(self, text: str, output_path: str) -> str:
        """Generate English speech using XTTS with voice cloning"""
        print(f"🇺🇸 English: {text[:50]}...")

        # Check if reference audio exists for XTTS
        if os.path.exists(self.reference):
            try:
                self._load_xtts()
                self.tts.tts_to_file(
                    text=text,
                    speaker_wav=self.reference,
                    language="en",
                    file_path=output_path
                )
                self._last_output = output_path
                print(f"✅ Saved (XTTS): {output_path}")
                return output_path
            except Exception as e:
                print(f"⚠️ XTTS failed, falling back to Edge TTS: {e}")

        # Fallback to Edge TTS
        asyncio.run(self._edge_tts(text, output_path, self.english_voice))
        self._last_output = output_path
        print(f"✅ Saved (Edge): {output_path}")
        return output_path

    def speak_mixed(self, text: str, output_path: Optional[str] = None) -> str:
        """
        Handle mixed Thai/English text by splitting and combining

        Args:
            text: Mixed language text
            output_path: Output file path

        Returns:
            Path to combined audio
        """
        if output_path is None:
            import time
            timestamp = int(time.time())
            output_path = str(OUTPUT_DIR / f"robin_mixed_{timestamp}.wav")

        # Split by language (simple approach)
        segments = self._split_by_language(text)

        if len(segments) == 1:
            # Single language, use normal speak
            return self.speak(text, output_path)

        # Generate audio for each segment
        temp_files = []
        for i, (lang, segment_text) in enumerate(segments):
            temp_path = str(OUTPUT_DIR / f"temp_{i}.wav")
            if lang == "thai":
                self._speak_thai(segment_text, temp_path)
            else:
                self._speak_english(segment_text, temp_path)
            temp_files.append(temp_path)

        # Concatenate audio files
        self._concat_audio(temp_files, output_path)

        # Cleanup temp files
        for f in temp_files:
            try:
                os.remove(f)
            except:
                pass

        self._last_output = output_path
        return output_path

    def _split_by_language(self, text: str) -> list:
        """Split text into (language, text) segments"""
        segments = []
        current_lang = None
        current_text = []

        for char in text:
            is_thai_char = bool(THAI_PATTERN.match(char))
            lang = "thai" if is_thai_char else "english"

            if current_lang is None:
                current_lang = lang

            if lang != current_lang and char.strip():
                if current_text:
                    segments.append((current_lang, "".join(current_text).strip()))
                current_text = [char]
                current_lang = lang
            else:
                current_text.append(char)

        if current_text:
            segments.append((current_lang, "".join(current_text).strip()))

        return [(lang, text) for lang, text in segments if text.strip()]

    def _concat_audio(self, input_files: list, output_path: str):
        """Concatenate audio files using ffmpeg"""
        # Create file list
        list_file = str(OUTPUT_DIR / "concat_list.txt")
        with open(list_file, "w") as f:
            for file in input_files:
                f.write(f"file '{file}'\n")

        # Concatenate
        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", list_file, "-c", "copy", output_path
        ], capture_output=True)

        os.remove(list_file)

    def play(self, audio_path: Optional[str] = None):
        """Play the generated audio"""
        path = audio_path or self._last_output
        if not path or not os.path.exists(path):
            print("❌ No audio to play")
            return

        print(f"🔊 Playing: {path}")

        if sys.platform == "darwin":
            subprocess.run(["afplay", path], check=True)
        elif sys.platform == "linux":
            subprocess.run(["aplay", path], check=True)
        elif sys.platform == "win32":
            import winsound
            winsound.PlaySound(path, winsound.SND_FILENAME)

    def set_voice(self, reference_audio: str):
        """Change the reference voice for XTTS"""
        if not os.path.exists(reference_audio):
            raise FileNotFoundError(f"Voice file not found: {reference_audio}")
        self.reference = reference_audio
        self.tts = None  # Reset to reload with new voice
        print(f"🎭 Voice changed: {reference_audio}")

    def list_voices(self) -> dict:
        """List available voices"""
        return {
            "thai": self.thai_voice,
            "english_clone": self.reference if os.path.exists(self.reference) else None,
            "english_fallback": self.english_voice,
        }


# CLI interface
def main():
    import argparse

    parser = argparse.ArgumentParser(description="Robin Voice - Thai/English TTS")
    parser.add_argument("text", nargs="?", help="Text to speak")
    parser.add_argument("-o", "--output", help="Output file path")
    parser.add_argument("-v", "--voice", help="Reference voice for English")
    parser.add_argument("--thai", action="store_true", help="Force Thai TTS")
    parser.add_argument("--english", action="store_true", help="Force English TTS")
    parser.add_argument("--play", action="store_true", help="Play after generation")
    parser.add_argument("--list-voices", action="store_true", help="List available voices")

    args = parser.parse_args()

    robin = RobinVoice(reference_audio=args.voice)

    if args.list_voices:
        voices = robin.list_voices()
        print("Available voices:")
        for k, v in voices.items():
            print(f"  {k}: {v}")
        return

    if not args.text:
        # Interactive mode
        print("🎙️ Robin Voice - Interactive Mode")
        print("   Thai text → Edge TTS (native)")
        print("   English text → XTTS (voice clone)")
        print("   Type 'quit' to exit\n")
        while True:
            text = input("You: ").strip()
            if text.lower() in ("quit", "exit", "q"):
                break
            if text:
                output = robin.speak(text)
                robin.play()
    else:
        output = robin.speak(
            args.text,
            args.output,
            force_thai=args.thai,
            force_english=args.english
        )
        if args.play:
            robin.play()


if __name__ == "__main__":
    main()
