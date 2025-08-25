"""
Validation Cache Module
Purpose: Cache validation results to improve performance for repeated validations
"""

import hashlib
import json
from typing import Any, Dict, Optional, Tuple
from datetime import datetime, timedelta
from functools import wraps
import time

class ValidationCache:
    """Simple in-memory validation cache with TTL."""
    
    def __init__(self, ttl_seconds: int = 300):  # 5 minutes default
        self.cache: Dict[str, Tuple[Any, float]] = {}
        self.ttl_seconds = ttl_seconds
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'evictions': 0
        }
    
    def _generate_key(self, data: Any) -> str:
        """Generate a cache key from validation data."""
        # Convert data to a stable string representation
        if isinstance(data, dict):
            # Sort keys for consistent hashing
            sorted_data = dict(sorted(data.items()))
            data_str = json.dumps(sorted_data, sort_keys=True, default=str)
        else:
            data_str = str(data)
        
        # Create hash of the data
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def get(self, data: Any) -> Optional[Any]:
        """Get cached validation result."""
        key = self._generate_key(data)
        
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl_seconds:
                self.stats['hits'] += 1
                return result
            else:
                # Expired, remove it
                del self.cache[key]
                self.stats['evictions'] += 1
        
        self.stats['misses'] += 1
        return None
    
    def set(self, data: Any, result: Any) -> None:
        """Cache validation result."""
        key = self._generate_key(data)
        self.cache[key] = (result, time.time())
        self.stats['sets'] += 1
        
        # Simple cleanup: remove expired entries
        current_time = time.time()
        expired_keys = [
            k for k, (_, timestamp) in self.cache.items()
            if current_time - timestamp >= self.ttl_seconds
        ]
        for k in expired_keys:
            del self.cache[k]
            self.stats['evictions'] += 1
    
    def clear(self) -> None:
        """Clear all cached data."""
        self.cache.clear()
        self.stats['evictions'] += len(self.cache)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        current_size = len(self.cache)
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'current_size': current_size,
            'hit_rate': f"{hit_rate:.1f}%",
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'sets': self.stats['sets'],
            'evictions': self.stats['evictions'],
            'total_requests': total_requests
        }

# Global validation cache instance
validation_cache = ValidationCache()

def cached_validation(func):
    """Decorator to cache validation results."""
    @wraps(func)
    def wrapper(cls, v, *args, **kwargs):
        # Create cache key from validation data
        cache_data = {
            'validator': func.__name__,
            'value': v,
            'class': cls.__name__
        }
        
        # Try to get from cache
        cached_result = validation_cache.get(cache_data)
        if cached_result is not None:
            return cached_result
        
        # Perform validation
        result = func(cls, v, *args, **kwargs)
        
        # Cache the result
        validation_cache.set(cache_data, result)
        
        return result
    
    return wrapper

def get_validation_cache_stats() -> Dict[str, Any]:
    """Get validation cache statistics."""
    return validation_cache.get_stats()

def clear_validation_cache() -> None:
    """Clear the validation cache."""
    validation_cache.clear()
