#!/usr/bin/env python3
"""Construye los tres documentos desde Markdown; no es necesario para usar la app."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "docs/latex"
TEMPLATE = DEST / "document-template.tex"
GENERATOR = Path(__file__).resolve()
VERSION_FILE = ROOT / "package.json"
APP_VERSION = json.loads(VERSION_FILE.read_text(encoding="utf-8"))["version"]
DOCS = [
    ("uso", "Manual_Uso_Compas_a_compas", "Manual de uso",
     "docs/manuals/USO.md", "Editar, guardar e imprimir hojas de acordes"),
    ("instalacion", "Manual_Instalacion_Compas_a_compas", "Instalación y arranque",
     "docs/manuals/INSTALACION.md", "Abrir la aplicación desde la carpeta del proyecto"),
    ("dts", "DTS_Compas_a_compas", "Diseño técnico del software",
     "docs/DTS.md", "Arquitectura, datos, paginación y operación local"),
]
IMAGE_RE = re.compile(r"!\[[^\]\n]*\]\((capturas/[a-z0-9-]+\.png)\)")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return path.resolve().relative_to(ROOT).as_posix()


def run(command, **kwargs):
    result = subprocess.run(command, capture_output=True, text=True,
                            encoding="utf-8", errors="replace", **kwargs)
    if result.returncode:
        raise SystemExit(result.stdout[-6000:] + result.stderr[-4000:])
    return result


def build(doc, engine):
    key, name, title, source_name, subtitle = doc
    source = ROOT / source_name
    body = re.sub(r"^# [^\n]+\n", "", source.read_text(encoding="utf-8"), count=1)
    captures = list(dict.fromkeys((source.parent / m.group(1)).resolve()
                                 for m in IMAGE_RE.finditer(body)))
    for capture in captures:
        if not capture.is_file():
            raise SystemExit("Falta captura: " + str(capture))
    with tempfile.TemporaryDirectory(prefix="compas-docs-") as temp:
        work = Path(temp)
        md = work / "body.md"
        md.write_text(body, encoding="utf-8", newline="\n")
        tex = work / (name + ".tex")
        run(["pandoc", str(md), "--from=gfm", "--to=latex", "--standalone",
             "--no-highlight", "--shift-heading-level-by=-1",
             "--template=" + str(TEMPLATE), "--output=" + str(tex),
             "--variable=covertitle:" + title, "--variable=coversubtitle:" + subtitle,
             "--variable=headtitle:" + title, "--variable=appversion:" + APP_VERSION], cwd=ROOT)
        latex = tex.read_text(encoding="utf-8")
        def columns(match):
            count = len(match.group(1))
            fractions = [0.32, 0.68] if count == 2 else [1 / count] * count
            padding = (2 * count - 2) / count
            specs = "".join(r">{\raggedright\arraybackslash}p{\dimexpr" + f"{part:.6f}" +
                            r"\linewidth-" + f"{padding:.6f}" + r"\tabcolsep\relax}"
                            for part in fractions)
            return r"\begin{longtable}[]{@{}" + specs + r"@{}}"
        latex = re.sub(r"\\begin\{longtable\}\[\]\{@\{\}([lcr]+)@\{\}\}", columns, latex)
        latex = re.sub(r"^(\\hypertarget\{[^\n]+\}\{%\s*\\section|\\section)",
                       r"\\Needspace{3.5cm}\n\1", latex, flags=re.M)
        latex = latex.replace("{capturas/", "{../manuals/capturas/")
        latex = re.sub(r"\\includegraphics(\[[^\]]*\])?\{\.\./manuals/capturas/",
                       r"\\includegraphics[width=\\linewidth,height=0.44\\textheight,keepaspectratio]{../manuals/capturas/", latex)
        latex = latex.replace("% !TeX program = lualatex", "% !TeX program = " + engine)
        latex = "% Source-SHA256: " + sha(source) + "\n" + latex
        build_dir = work / "docs/latex"
        build_dir.mkdir(parents=True)
        final_tex = build_dir / tex.name
        final_tex.write_text(latex, encoding="utf-8", newline="\n")
        capture_dir = work / "docs/manuals/capturas"
        capture_dir.mkdir(parents=True)
        for capture in captures:
            shutil.copyfile(capture, capture_dir / capture.name)
        for _ in range(3):
            run([engine, "-interaction=nonstopmode", "-halt-on-error",
                 "-output-directory=.", final_tex.name], cwd=build_dir)
        log = (build_dir / (name + ".log")).read_text(encoding="utf-8", errors="replace")
        issues = [item for item in ("Overfull \\hbox", "Overfull \\vbox",
                  "Missing character", "Float too large", "undefined references") if item in log]
        if issues:
            lines = log.splitlines()
            details = "\n".join("\n".join(lines[i:i + 5]) for i, line in enumerate(lines)
                                if any(issue in line for issue in issues))
            raise SystemExit(title + ": problemas LaTeX: " + ", ".join(issues) + "\n" + details)
        DEST.mkdir(parents=True, exist_ok=True)
        for suffix in (".tex", ".pdf"):
            shutil.copyfile(build_dir / (name + suffix), DEST / (name + suffix))
    inputs = [(source, "source"), (TEMPLATE, "template"), (GENERATOR, "generator"), (VERSION_FILE, "application-version")]
    inputs += [(capture, "capture") for capture in captures]
    outputs = [(DEST / (name + ext), role) for ext, role in ((".tex", "latex"), (".pdf", "pdf"))]
    manifest = {"document": key, "applicationVersion": APP_VERSION, "edition": "2026-10-18",
                "source": source_name, "command": "python scripts/build_docs.py", "engine": engine,
                "files": [{"path": rel(p), "sha256": sha(p), "role": role} for p, role in inputs + outputs]}
    (DEST / (name + ".build.json")).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(title + " generado")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine", choices=("auto", "lualatex", "xelatex"), default="auto")
    args = parser.parse_args()
    engine = args.engine
    if engine == "auto":
        # Una instalación parcial de LuaLaTeX puede carecer del cargador de fuentes.
        kpse = shutil.which("kpsewhich")
        lua_fonts = (subprocess.run([kpse, "luaotfload-main.lua"], capture_output=True).returncode == 0
                     if kpse else False)
        engine = "lualatex" if shutil.which("lualatex") and lua_fonts else "xelatex"
    for executable in ("pandoc", engine):
        if not shutil.which(executable):
            raise SystemExit("Falta " + executable + ". Consulta docs/manuals/README.md.")
    for doc in DOCS:
        build(doc, engine)


if __name__ == "__main__":
    main()
