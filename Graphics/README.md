# Group One – 3D Geometry Transformations Tutor

## 1. Overview

This project is an **interactive, graphics-based educational tool** built for the **Group One project: “Build a graphics-based educational tool for teaching geometry or physics.”** It uses **WebGL (via JavaScript)** to visualise core computer graphics concepts and 3D geometry:

- 3D modelling with a coloured cube and coordinate axes.
- Geometric transformations (translation, rotation, scaling).
- Camera / viewing transformation using a `lookAt` matrix.
- Perspective vs orthographic projection.
- Simple lighting (ambient + diffuse shading).

The application is intended as a **teaching aid** for explaining how the model, view, and projection matrices combine to form the final 4×4 MVP matrix used to transform vertices in the graphics pipeline.

## 2. Directory Contents

- `index.html` – Main HTML page containing the canvas, UI controls, and explanatory text.
- `styles.css` – Styling for the dark-themed, responsive user interface.
- `main.js` – WebGL application logic, including:
  - Creation of the cube and axis geometry.
  - Matrix math (model, view, projection).
  - Lighting calculations (ambient and diffuse).
  - Animation / rendering loop and event handling for controls.
- `README.md` – This file; describes the contents of the directory and how to run the project.
- `REPORT.md` – Documentation explaining the problem, approach, theory, and implementation details of the solution.
- `Makefile` – Build, clean, and helper rules for compiling/running the project in a typical Unix-like environment.

No additional external libraries are required; the project uses **only standard HTML, CSS, and JavaScript APIs**.

## 3. How to Run the Application

1. Ensure you have a modern web browser that supports WebGL (e.g. Chrome, Edge, Firefox).
2. Open `index.html` directly in the browser:
   - **On Windows**: double-click `index.html` or right-click and choose “Open with” → your browser.
   - **With `make` (Linux/macOS)**: run `make run` in this directory (see Makefile).
3. Interact with the UI controls on the right:
   - Adjust rotations (X/Y/Z), translation, and scale.
   - Switch between **Perspective** and **Orthographic** projection.
   - Modify camera distance.
   - Enable/disable lighting and adjust ambient/diffuse intensity.
4. Observe:
   - The **3D cube and coordinate axes** updating in real-time in the canvas.
   - The **4×4 Model-View-Projection (MVP) matrix** shown in the “Current Transformation Matrix” panel.

## 4. Makefile Usage

The project is primarily an interpreted **WebGL/JavaScript** application, so there is no traditional compilation step. However, the provided `Makefile` contains convenience rules that match the course submission requirements:

- `make` or `make all`  
  Runs basic checks or preparation steps (currently just prints a message indicating that no compilation is required for HTML/JS).

- `make run`  
  Attempts to open `index.html` in the default browser on common platforms (Linux/macOS/Windows).

- `make clean`  
  Removes temporary files such as object files (`*.o`), backup files (`*~`), and core dumps (`core`, `core.*`) if any are created.

These rules can be extended if the environment requires additional tooling (such as bundlers or linters), but they are not necessary for this simple project.

## 5. Documentation

For a complete written explanation of the project, refer to:

- `REPORT.md` – Contains:
  - Problem description and objectives.
  - Theoretical background (matrices, transformations, projections, lighting).
  - System design and implementation details.
  - Usage instructions and testing notes.
  - How it supports learning about computer graphics and 3D geometry.

This report can be printed or converted into another format (e.g. Word or PDF) as required for submission.

Git Hub Link https://github.com/ibrahimsoriejalloh/Computer-Graphic-Group-One.git

#Computer Graphic Group One