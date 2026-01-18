# QUICK REFERENCE - Gitfiti

## What is it?

**Gitfiti** draws pixel art on your GitHub contribution calendar by creating backdated commits.

## Installation

```bash
git clone https://github.com/gelstudios/gitfiti.git
cd gitfiti
python3 gitfiti.py
```

No dependencies required!

## Usage

```bash
$ python3 gitfiti.py

# Follow prompts:
# 1. GitHub URL (default: github.com)
# 2. Your username
# 3. New repo name (create empty repo first!)
# 4. Week offset (position on calendar)
# 5. Multiplier (type "gitfiti" for max)
# 6. Image name (kitty, heart, octocat, etc.)
# 7. Shell (bash or powershell)

# Run generated script:
bash gitfiti.sh
```

## Built-in Images

| Name | Description |
|------|-------------|
| `kitty` | Cat face |
| `oneup` | Mario mushroom |
| `octocat` | GitHub mascot |
| `hello` | "HELLO" text |
| `heart` | Heart shape |
| `hireme` | "HIRE ME" text |
| `beer` | Beer glass |
| `gliders` | Game of Life |

## Custom Images

Create file with format:
```
:my-image
[[0,4,4,4,0],
 [4,0,0,0,4],
 [4,0,0,0,4],
 [4,0,0,0,4],
 [0,4,4,4,0]]
```

Pixel values: 0=blank, 1-4=light→dark green

## How It Works

1. Fetches your GitHub contribution data
2. Generates shell script with backdated commits
3. Uses `GIT_AUTHOR_DATE` environment variable
4. Empty commits (`--allow-empty`) with fake dates
5. Push to new repo → appears on calendar

## Remove

Delete the repository on GitHub. Wait 1-2 days for cache to clear.

## Notes

- Create a NEW empty repo first
- Uses SSH authentication
- May take 1-2 days to appear
- Thousands of commits for complex images
