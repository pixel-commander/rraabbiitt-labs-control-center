"""Local MLflow logging for Hybrid Seat Ranking experiments and checkpoints.

This module deliberately uses an explicit SQLite tracking/registry URI and a
file artifact store rooted under ``<model-root>/data/mlflow``. It does not use
MLflow's process-global fluent tracking URI or change active.json.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import re
import tempfile
from collections.abc import Mapping, Sequence
from pathlib import Path, PurePosixPath
from typing import Any

EXPERIMENT_NAME = "hybrid-seat-ranking"
REGISTERED_MODEL_NAME = "hybrid-seat-ranking"
_SCHEMA = 1


class TrackingError(RuntimeError):
    """Raised when local experiment or checkpoint tracking fails."""


def _json_default(value: Any) -> Any:
    if isinstance(value, os.PathLike):
        return os.fspath(value)
    if hasattr(value, "item"):
        return value.item()
    raise TypeError(f"Not JSON serializable: {type(value).__name__}")


def _json_text(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, default=_json_default, indent=2) + "\n"


def _local_paths(root: str | os.PathLike[str]) -> tuple[Path, Path, str, str]:
    model_root = Path(root).expanduser().resolve()
    tracking_dir = model_root / "data" / "mlflow"
    database = tracking_dir / "mlflow.db"
    artifact_dir = tracking_dir / "artifacts"
    tracking_dir.mkdir(parents=True, exist_ok=True)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    try:
        from sqlalchemy.engine import URL

        tracking_uri = URL.create("sqlite", database=str(database)).render_as_string(hide_password=False)
    except Exception as exc:
        raise TrackingError(f"Could not construct the local SQLite tracking URI: {exc}") from exc
    return model_root, tracking_dir, tracking_uri, artifact_dir.as_uri()


def _client_and_experiment(root: str | os.PathLike[str]):
    _model_root, tracking_dir, tracking_uri, artifact_root = _local_paths(root)
    try:
        from mlflow.tracking import MlflowClient
    except ImportError as exc:
        raise TrackingError("MLflow is required for experiment tracking; install it in the configured local environment.") from exc
    try:
        # Explicit URIs prevent MLFLOW_TRACKING_URI/REGISTRY_URI from redirecting
        # local runs to an inherited remote service.
        client = MlflowClient(tracking_uri=tracking_uri, registry_uri=tracking_uri)
        experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
        # A copied MLflow database retains its original absolute artifact URI.
        # Keep that history and start new runs at this package's current path.
        experiment_name = EXPERIMENT_NAME
        if experiment is not None and experiment.artifact_location.rstrip('/') != artifact_root.rstrip('/'):
            suffix = hashlib.sha256(artifact_root.encode('utf-8')).hexdigest()[:12]
            experiment_name = f'{EXPERIMENT_NAME}-{suffix}'
            experiment = client.get_experiment_by_name(experiment_name)
        if experiment is None:
            experiment_id = client.create_experiment(experiment_name, artifact_location=artifact_root)
            experiment = client.get_experiment(experiment_id)
        if experiment is None:
            raise TrackingError("MLflow did not return the local experiment after creating it.")
        if not experiment.artifact_location.startswith("file:"):
            raise TrackingError(f"Experiment artifact location is not local: {experiment.artifact_location}")
        return client, experiment, tracking_uri, tracking_dir
    except TrackingError:
        raise
    except Exception as exc:
        raise TrackingError(f"Could not open the local MLflow experiment at {tracking_uri}: {exc}") from exc


def _mapping(value: Mapping[str, Any] | None, label: str) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise TypeError(f"{label} must be a mapping")
    return {str(key): item for key, item in value.items()}


def _artifact_path(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    path = PurePosixPath(str(value).replace("\\", "/"))
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"Artifact path must be a relative path without '..': {value}")
    return path.as_posix()


def _artifact_entries(root: Path, artifacts: Any) -> list[tuple[str | None, Path]]:
    if artifacts is None:
        return []
    if isinstance(artifacts, (str, os.PathLike)):
        raw_entries = [(None, artifacts)]
    elif isinstance(artifacts, Mapping):
        raw_entries = [(str(name), path) for name, path in artifacts.items()]
    elif isinstance(artifacts, Sequence) and not isinstance(artifacts, (bytes, bytearray, str)):
        raw_entries = [(None, path) for path in artifacts]
    else:
        raise TypeError("artifacts must be a path, a sequence of paths, or a mapping of artifact paths to local paths")
    entries: list[tuple[str | None, Path]] = []
    for artifact_name, source in raw_entries:
        if not isinstance(source, (str, os.PathLike)):
            raise TypeError(f"Artifact source must be a local path, got {type(source).__name__}")
        local = Path(source).expanduser()
        if not local.is_absolute():
            local = root / local
        local = local.resolve(strict=True)
        if not local.is_file() and not local.is_dir():
            raise ValueError(f"Artifact source is not a file or directory: {local}")
        entries.append((_artifact_path(artifact_name), local))
    return entries


def _param_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if value is None or isinstance(value, (bool, int, float)):
        return str(value)
    return json.dumps(value, ensure_ascii=False, sort_keys=True, default=_json_default, separators=(",", ":"))


def _normalize_metrics(metrics: Mapping[str, Any]) -> dict[str, float]:
    normalized: dict[str, float] = {}
    for key, value in metrics.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
            raise ValueError(f"Metric {key!r} must be a finite number")
        normalized[str(key)] = float(value)
    return normalized


def _log_local_run(
    client: Any,
    experiment: Any,
    tracking_uri: str,
    tracking_dir: Path,
    name: str,
    params: Mapping[str, Any],
    metrics: Mapping[str, Any],
    artifact_entries: list[tuple[str | None, Path]],
    tags: Mapping[str, Any],
) -> dict[str, str]:
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name must be a non-empty string")
    params = _mapping(params, "params")
    metrics = _normalize_metrics(_mapping(metrics, "metrics"))
    tag_values = _mapping(tags, "tags")
    tag_values = {key: _param_text(value) for key, value in tag_values.items()}
    tag_values.setdefault("tracking.owner", "models/hybrid-seat-ranking/experiment_tracking.py")
    run = None
    try:
        run = client.create_run(experiment.experiment_id, tags=tag_values, run_name=name.strip())
        run_id = run.info.run_id
        for key, value in params.items():
            param_value = _param_text(value)
            if len(key) > 250:
                raise ValueError(f"Parameter key exceeds MLflow's 250-character limit: {key[:80]!r}")
            if len(param_value) > 500:
                digest = hashlib.sha256(param_value.encode("utf-8")).hexdigest()
                param_value = f"sha256:{digest} (full value in params.json artifact)"
            client.log_param(run_id, key, param_value)
        for key, value in metrics.items():
            client.log_metric(run_id, key, value)
        for artifact_name, local_path in artifact_entries:
            destination = artifact_name
            if destination is None:
                destination = local_path.name if local_path.is_dir() else "artifacts"
            if local_path.is_dir():
                client.log_artifacts(run_id, str(local_path), artifact_path=destination)
            else:
                client.log_artifact(run_id, str(local_path), artifact_path=destination)
        with tempfile.TemporaryDirectory(prefix="hybrid-seat-ranking-mlflow-", dir=tracking_dir) as scratch:
            metadata_dir = Path(scratch)
            (metadata_dir / "params.json").write_text(_json_text(params), encoding="utf-8")
            (metadata_dir / "metrics.json").write_text(_json_text(metrics), encoding="utf-8")
            client.log_artifact(run_id, str(metadata_dir / "params.json"), artifact_path="run-metadata")
            client.log_artifact(run_id, str(metadata_dir / "metrics.json"), artifact_path="run-metadata")
        client.set_terminated(run_id, status="FINISHED")
        finished = client.get_run(run_id)
        return {"run_id": run_id, "tracking_uri": tracking_uri, "artifact_uri": finished.info.artifact_uri}
    except Exception as exc:
        if run is not None:
            try:
                client.set_terminated(run.info.run_id, status="FAILED")
            except Exception:
                pass
        if isinstance(exc, (TypeError, ValueError)):
            raise
        raise TrackingError(f"MLflow logging failed for run {name!r}: {exc}") from exc


def log_run(root, name, params, metrics, artifacts, tags=None):
    """Log one local experiment run and return its MLflow identifiers.

    ``artifacts`` accepts a local path, a sequence of local paths, or a mapping
    from relative MLflow artifact paths to local files/directories. Relative
    local paths are resolved from ``root``. Full params/metrics are retained as
    JSON artifacts as well as scalar MLflow params/metrics.
    """
    client, experiment, tracking_uri, tracking_dir = _client_and_experiment(root)
    model_root = Path(root).expanduser().resolve()
    entries = _artifact_entries(model_root, artifacts)
    return _log_local_run(client, experiment, tracking_uri, tracking_dir, name, params, metrics, entries, _mapping(tags, "tags"))


def _checkpoint_identity(folder: Path, report: Mapping[str, Any]) -> tuple[str, str]:
    checkpoint_id = str(report.get("checkpoint") or folder.name)
    identity = hashlib.sha256(f"{folder.resolve()}\n{checkpoint_id}".encode("utf-8")).hexdigest()[:16]
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", folder.name).strip("._") or "checkpoint"
    return checkpoint_id, f"{safe_name}-{identity}.json"


def _parent_details(root: Path, marker_dir: Path, parent: Any) -> tuple[str | None, str | None]:
    if parent is None:
        return None, None
    if isinstance(parent, Mapping):
        parent_checkpoint = parent.get("checkpoint") or parent.get("path")
        parent_run_id = parent.get("run_id")
    else:
        parent_checkpoint = str(parent)
        parent_run_id = None
    parent_checkpoint = str(parent_checkpoint) if parent_checkpoint is not None else None
    if parent_checkpoint and not parent_run_id:
        parent_path = Path(parent_checkpoint.replace("\\", "/"))
        parent_names = {parent_checkpoint.replace("\\", "/"), parent_path.name}
        for marker in marker_dir.glob("*.json"):
            try:
                saved = json.loads(marker.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            saved_id = str(saved.get("checkpoint_id", ""))
            saved_path = str(saved.get("checkpoint_path", "")).replace("\\", "/")
            if saved_id in parent_names or saved_path in parent_names or Path(saved_path).name in parent_names:
                parent_run_id = saved.get("run_id")
                break
    return parent_checkpoint, str(parent_run_id) if parent_run_id else None


def _atomic_json(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(_json_text(value), encoding="utf-8")
    temp.replace(path)


def _registry_checkpoint(client: Any, checkpoint_source: str, run_id: str, checkpoint_id: str, checkpoint_path: str, parent_checkpoint: str | None, parent_run_id: str | None) -> dict[str, str]:
    try:
        registered = client.search_registered_models(filter_string=f"name = '{REGISTERED_MODEL_NAME}'", max_results=1)
        if not registered:
            try:
                client.create_registered_model(REGISTERED_MODEL_NAME, tags={"tracking.owner": "Hybrid Seat Ranking"})
            except Exception:
                # Another local process may have created the same registered model.
                if not client.search_registered_models(filter_string=f"name = '{REGISTERED_MODEL_NAME}'", max_results=1):
                    raise
        versions = client.search_model_versions(f"name = '{REGISTERED_MODEL_NAME}'")
        for version in versions:
            if version.tags.get("checkpoint.key") == checkpoint_id:
                return {"model_name": REGISTERED_MODEL_NAME, "model_version": str(version.version), "model_source": version.source}
        version_tags = {"checkpoint.key": checkpoint_id, "checkpoint.path": checkpoint_path, "checkpoint.run_id": run_id}
        if parent_checkpoint:
            version_tags["parent.checkpoint"] = parent_checkpoint
        if parent_run_id:
            version_tags["parent.run_id"] = parent_run_id
        version = client.create_model_version(
            name=REGISTERED_MODEL_NAME,
            source=checkpoint_source,
            run_id=run_id,
            tags=version_tags,
        )
        return {"model_name": REGISTERED_MODEL_NAME, "model_version": str(version.version), "model_source": version.source}
    except Exception as exc:
        raise TrackingError(f"Could not register checkpoint {checkpoint_id!r} in the local MLflow model registry: {exc}") from exc


def log_checkpoint(root, folder, report, parent=None):
    """Log a checkpoint and register its artifact directory as a model version.

    The registered source is ``runs:/<run_id>/checkpoint``. This records a
    versioned checkpoint artifact; it is not an MLflow pyfunc model and cannot
    be loaded with ``mlflow.pyfunc.load_model`` without a separately defined
    MLflow model flavor/loader.
    """
    if not isinstance(report, Mapping):
        raise TypeError("report must be a mapping")
    report_copy = dict(report)
    model_root = Path(root).expanduser().resolve()
    checkpoint_folder = Path(folder).expanduser()
    if not checkpoint_folder.is_absolute():
        checkpoint_folder = model_root / checkpoint_folder
    checkpoint_folder = checkpoint_folder.resolve(strict=True)
    if not checkpoint_folder.is_dir():
        raise ValueError(f"Checkpoint folder is not a directory: {checkpoint_folder}")
    checkpoint_id, marker_name = _checkpoint_identity(checkpoint_folder, report_copy)
    client, experiment, tracking_uri, tracking_dir = _client_and_experiment(model_root)
    marker_dir = tracking_dir / "checkpoints"
    marker_path = marker_dir / marker_name
    if marker_path.exists():
        try:
            marker = json.loads(marker_path.read_text(encoding="utf-8"))
            if marker.get("checkpoint_path") != str(checkpoint_folder):
                raise TrackingError(f"Checkpoint marker points to a different folder: {marker_path}")
            if marker.get("status") == "registered":
                return {key: str(value) for key, value in marker["result"].items()}
        except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
            raise TrackingError(f"Could not read checkpoint idempotency marker {marker_path}: {exc}") from exc
    parent_checkpoint, parent_run_id = _parent_details(model_root, marker_dir, parent)
    if marker_path.exists():
        marker = json.loads(marker_path.read_text(encoding="utf-8"))
        run_result = {key: str(marker[key]) for key in ("run_id", "tracking_uri", "artifact_uri")}
    else:
        params = {key: value for key, value in report_copy.items() if key not in {"limitations"}}
        params.update({"checkpoint_id": checkpoint_id, "checkpoint_path": str(checkpoint_folder)})
        metrics = {key: value for key, value in report_copy.items() if isinstance(value, (int, float)) and not isinstance(value, bool)}
        tags = {"checkpoint.key": checkpoint_id, "checkpoint.path": str(checkpoint_folder)}
        if parent_checkpoint:
            tags["parent.checkpoint"] = parent_checkpoint
        if parent_run_id:
            tags["mlflow.parentRunId"] = parent_run_id
        report_path = checkpoint_folder / "report.json"
        with tempfile.TemporaryDirectory(prefix="hybrid-seat-ranking-checkpoint-") as scratch:
            report_artifact = Path(scratch) / "report.json"
            report_artifact.write_text(_json_text(report_copy), encoding="utf-8")
            artifacts = {"checkpoint": checkpoint_folder, "metadata": report_artifact}
            run_result = _log_local_run(client, experiment, tracking_uri, tracking_dir, f"checkpoint:{checkpoint_id}", params, metrics, _artifact_entries(model_root, artifacts), tags)
        marker = {
            "schema": _SCHEMA,
            "status": "run_logged",
            "checkpoint_id": checkpoint_id,
            "checkpoint_path": str(checkpoint_folder),
            "run_id": run_result["run_id"],
            "tracking_uri": tracking_uri,
            "artifact_uri": run_result["artifact_uri"],
            "parent_checkpoint": parent_checkpoint,
            "parent_run_id": parent_run_id,
        }
        _atomic_json(marker_path, marker)
    checkpoint_source = f"runs:/{run_result['run_id']}/checkpoint"
    registry = _registry_checkpoint(client, checkpoint_source, run_result["run_id"], checkpoint_id, str(checkpoint_folder), parent_checkpoint, parent_run_id)
    result = {**run_result, **registry, "checkpoint_id": checkpoint_id, "checkpoint_path": str(checkpoint_folder)}
    _atomic_json(marker_path, {
        "schema": _SCHEMA,
        "status": "registered",
        "checkpoint_id": checkpoint_id,
        "checkpoint_path": str(checkpoint_folder),
        **run_result,
        **registry,
        "parent_checkpoint": parent_checkpoint,
        "parent_run_id": parent_run_id,
        "result": result,
    })
    return result

