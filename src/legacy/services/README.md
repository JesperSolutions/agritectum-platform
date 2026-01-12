# Legacy Services Archive

This directory contains service files that have been replaced, deprecated, or are legacy wrappers.

## Purpose

Services moved here are kept for:
- Backward compatibility
- Migration reference
- Understanding service evolution

## Services

See [ARCHIVE_MANIFEST.md](../ARCHIVE_MANIFEST.md) for a complete inventory.

## Migration Guidelines

When using legacy services:
1. Check ARCHIVE_MANIFEST.md for migration path
2. Use the replacement service from main `src/services/` directory
3. Legacy wrappers may redirect to new services - check implementation
4. Deprecated functions should be replaced with new equivalents
