"""Logo image processing and serving cache.

Stored logos are normalised to small WebP images (they're displayed at 32–56px, so 128px
covers high-density screens), and served from an in-process LRU cache so repeat requests
skip the database round trip.
"""

import hashlib
import io
import logging
from dataclasses import dataclass

from cachetools import LRUCache
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

OUTPUT_SIZE = 128
OUTPUT_TYPE = "image/webp"
WEBP_QUALITY = 90
# Refuse absurd dimensions before decoding (decompression-bomb guard).
MAX_SOURCE_PIXELS = 4096 * 4096
CACHE_ENTRIES = 512


@dataclass(frozen=True, slots=True)
class CachedImage:
    data: bytes
    content_type: str
    etag: str


_cache: LRUCache[str, CachedImage] = LRUCache(maxsize=CACHE_ENTRIES)


def optimize_image(data: bytes) -> bytes | None:
    """Downscale to fit OUTPUT_SIZE and re-encode as WebP; None if it can't be decoded."""
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.width * source.height > MAX_SOURCE_PIXELS:
                return None
            image = source.convert("RGBA")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        logger.info("Logo isn't a decodable raster image; storing as-is")
        return None
    image.thumbnail((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    image.save(out, "WEBP", quality=WEBP_QUALITY, method=6)
    return out.getvalue()


def normalize_for_storage(data: bytes, content_type: str) -> tuple[bytes, str]:
    """Prefer the optimised WebP, unless the original is already smaller (tiny favicons)."""
    optimized = optimize_image(data)
    if optimized and len(optimized) < len(data):
        return optimized, OUTPUT_TYPE
    return data, content_type


def etag_for(data: bytes) -> str:
    return f'"{hashlib.sha256(data).hexdigest()[:20]}"'


def cache_get(domain: str) -> CachedImage | None:
    return _cache.get(domain)


def cache_put(domain: str, data: bytes, content_type: str) -> CachedImage:
    entry = CachedImage(data=data, content_type=content_type, etag=etag_for(data))
    _cache[domain] = entry
    return entry


def cache_forget(domain: str) -> None:
    _cache.pop(domain, None)


def cache_clear() -> None:
    _cache.clear()
