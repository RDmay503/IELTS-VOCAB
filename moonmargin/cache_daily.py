"""Prepare a rolling supply of date-specific readings for GitHub Pages."""
import datetime as dt
import json
from pathlib import Path
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo

today = dt.datetime.now(ZoneInfo("Asia/Shanghai")).date()
root = Path("_site/moonmargin/feed")
origin = "https://rdmay503.github.io/IELTS-VOCAB/moonmargin/feed/"
def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Moonmargin/1.1 (github.com/RDmay503/IELTS-VOCAB)"})
    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.load(response)["tfa"]
    if not all([data["title"], data["titles"]["normalized"], data["extract"].strip()]):
        raise ValueError("Incomplete reading")
    return {key: data[key] for key in ("title", "titles", "extract")}

def prepare(offset):
    date = today + dt.timedelta(days=offset)
    path = date.strftime("%Y/%m/%d.json")
    if (root / path).is_file():
        return True
    source = (date - dt.timedelta(days=8)).strftime("%Y/%m/%d")
    for url in (origin + path, "https://en.wikipedia.org/api/rest_v1/feed/featured/" + source):
        try:
            data = get(url)
        except Exception as error:
            print(date, error)
            continue
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps({"tfa": data}), encoding="utf-8")
        return True
    return False

if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(prepare, range(-2, 8)))
    if not all(results[2:4]):
        raise SystemExit("Missing today's or tomorrow's reading; retain the live deployment")
