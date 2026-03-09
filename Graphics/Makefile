# Makefile for Group One – 3D Geometry Transformations Tutor
#
# Note: This is a WebGL (HTML/CSS/JavaScript) application, so there is
# no traditional compilation step. These rules are provided to satisfy
# the course submission requirements and to offer convenient shortcuts.

SHELL := /bin/sh

.PHONY: all build run clean doc

all: build

build:
	@echo "Nothing to compile: this is a WebGL (HTML/CSS/JS) project."
	@echo "Use 'make run' to open index.html in your default browser."

run:
	@echo "Attempting to open index.html in your default browser..."
	@if command -v xdg-open >/dev/null 2>&1; then \
	  xdg-open index.html; \
	elif command -v open >/dev/null 2>&1; then \
	  open index.html; \
	elif command -v start >/dev/null 2>&1; then \
	  start index.html; \
	else \
	  echo "Please open index.html manually in your browser."; \
	fi

clean:
	@echo "Cleaning temporary and binary files (if any)..."
	@rm -f *.o *~ core core.* 2>/dev/null || true

doc:
	@echo "Documentation is available in REPORT.md and README.md."

