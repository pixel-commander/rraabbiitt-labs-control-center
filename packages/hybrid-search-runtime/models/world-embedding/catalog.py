"""Compatibility imports; project catalog ownership lives in the indexing tool."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_entry = Path(__file__).resolve().parents[4] / 'toolkit/tools/refresh-world-database/refresh_world_database.py'
_spec = spec_from_file_location('world_project_index', _entry)
_module = module_from_spec(_spec)
_spec.loader.exec_module(_module)
read_skill = _module.read_skill
prepare_catalog = _module.prepare_catalog
