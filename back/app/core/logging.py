"""
Centralized logger configuration.

Replaces the ad-hoc `print(f"[XP] ...")` style with the standard `logging`
module. Existing log message prefixes ([XP], [CATCH]) are preserved by using
named loggers and the standard format string.
"""

import logging
import sys

_FORMATTER = logging.Formatter(
    "%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_HANDLER = logging.StreamHandler(sys.stdout)
_HANDLER.setFormatter(_FORMATTER)


def get_logger(name: str) -> logging.Logger:
    """
    Return a logger named `name`. Idempotent — calling twice with the same
    name returns the same logger and does not double-attach handlers.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.addHandler(_HANDLER)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger
