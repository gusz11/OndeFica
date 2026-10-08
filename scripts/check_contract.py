"""Fail if Pydantic schemas or generated TypeScript are out of sync."""

import subprocess
import tempfile
from pathlib import Path

from export_openapi import ROOT, contract

saved = ROOT / "BackEnd/openapi.json"
if saved.read_text(encoding="utf-8") != contract():
    raise SystemExit(
        "OpenAPI desatualizado. Execute scripts/export_openapi.py e npm run generate:api."
    )
node = ROOT / "tools/api-types/node_modules/openapi-typescript/bin/cli.js"
with tempfile.TemporaryDirectory() as directory:
    generated = Path(directory) / "types.ts"
    subprocess.run(
        ["node", str(node), str(saved), "-o", str(generated)],
        check=True,
        capture_output=True,
    )
    if generated.read_text(encoding="utf-8") != (
        ROOT / "FrontEnd/src/types/api.generated.ts"
    ).read_text(encoding="utf-8"):
        raise SystemExit(
            "Tipos TypeScript desatualizados. Execute npm run generate:api."
        )
print("Pydantic, OpenAPI e TypeScript estão alinhados.")
