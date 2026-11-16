# Tools

The working tools for the Cyberpunk 2077 narrative playthrough project. They were copied in from a temporary session folder on November 16, 2026 (2026:320), so that they aren't lost with it.

Nothing here is part of the zine or the crew's storyline. The two silos don't depend on it.

## `planning-log/`: the pre-Heist planning log's source

- `planner_data.py`: the 61 entries, with their type, requirements, beats, methods and crew. Their order is a checklist, not the order the game is being played in.
- `build_planner.py`: lays the entries out as the print-and-write PDF.
- `fonts/`: the three Rajdhani weights the layout uses, with their license (SIL Open Font License 1.1).

To rebuild `cyberpunk2077PreHeistPlanningLog.pdf` at the repo root:

```
pip install reportlab
python3 tools/planning-log/build_planner.py cyberpunk2077PreHeistPlanningLog.pdf
```

It prints the page count. The current data gives 141 pages. A rebuild from this copy was checked against the PDF in the repo: same page count, same text on the pages compared.

To change the log, edit `planner_data.py` and rebuild.

## `issue-checker/`: the scripted zine tests

`mdcheck.py` runs the checks marked **[auto]** for groups A and H in `Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-TESTS.md`: the closing brackets (A7), raw HTML (H1), non-ASCII characters (H2), setext headings and trailing-space breaks (H3). It also counts fenced blocks, headings, rules and images.

```
pip install markdown-it-py
python3 tools/issue-checker/mdcheck.py Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-ISSUE-00.md
```

It also writes an HTML preview of each file into the folder it is run from, so run it from a scratch folder, or delete the `.html` file afterward.

It doesn't cover the tests marked **[read]**, or the **[auto]** tests in the other groups.

## `mastheads/`: the masthead shortlist

`masthead-faces.txt` lists the FIGlet faces (from pyfiglet 1.0.2) that draw `CHEAP TRUTH` within 100 columns. Each line is a face name, then the width and height of the result in characters.

Test A2 says no two issues may use the same face. The faces already used are in the register in `Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-ISSUES.md`.

```
pip install pyfiglet
python3 -c "import pyfiglet; print(pyfiglet.figlet_format('CHEAP TRUTH [0]', font='doom', width=200))"
```

## `cheap-truth-original/`: the original zine's text

Machine-read text of the original *Cheap Truth* (1983 to 1986), one file per scanned page. Every quotation from the original in the zine's rules comes from these files.

- The text is OCR, so it has errors. Check a quotation against the scans before printing it.
- The scans themselves are not in the repo.
- The original was published NOT COPYRIGHTED.
