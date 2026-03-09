# Group One – 3D Geometry Transformations Tutor  
## Graphics-Based Educational Tool – Project Documentation

### 1. Introduction

Computer Graphics is concerned with the generation, manipulation, and visualisation of images and scenes using computers. Modern applications in **science, engineering, education, and entertainment** all rely on a common graphics pipeline that transforms 3D objects into 2D images on the screen.

This project implements an **Interactive 3D Transformations Tutor** using **WebGL** (via JavaScript). The goal is to provide a **graphics-based educational tool** for demonstrating:

- 3D geometric transformations (translation, rotation, scaling).
- Camera / viewing transformations.
- Perspective vs orthographic projection.
- Simple illumination and shading using per-vertex lighting.

The application is intended to help students visually connect the **mathematical foundations** (matrices, vectors, projections) with the **practical implementation** in a real graphics API.

### 2. Problem Description and Objectives

#### 2.1 Problem Description

Students often find it difficult to understand how multiple transformation matrices (model, view, and projection) interact in the graphics pipeline. Abstract formulas for 4×4 matrices and homogeneous coordinates can be confusing without a visual demonstration.

This project addresses the problem by creating an **interactive 3D scene** where the student can:

- Manipulate transformation parameters with sliders and checkboxes.
- Immediately see the effect on a 3D object and coordinate axes.
- Observe the resulting **Model-View-Projection (MVP) matrix** in real-time.

#### 2.2 Objectives

The main objectives of the project are:

- To design and implement a small but complete **graphics application** using a modern graphics API (WebGL).
- To demonstrate core concepts from computer graphics and 3D geometry:
  - 3D modelling and coordinate systems.
  - 2D/3D transformations and viewing.
  - Projection (perspective vs orthographic).
  - Basic illumination and shading.
- To provide an **educational user interface** that allows students to experiment interactively with graphics parameters.
- To produce documentation that clearly explains both the **theory** and the **implementation**.

### 3. Theoretical Background

#### 3.1 Coordinate Systems and Homogeneous Coordinates

Computer graphics typically uses several coordinate systems:

- **Object (model) space** – coordinates defined relative to the object itself.
- **World space** – coordinates in the overall scene.
- **View (camera) space** – coordinates relative to a virtual camera.
- **Clip space and screen space** – coordinates after projection, ready for rasterisation.

Transformations between these spaces are represented by **4×4 matrices** using **homogeneous coordinates**. A 3D point \((x, y, z)\) is represented as \((x, y, z, 1)\) and multiplied by matrices to apply transformations.

#### 3.2 Model, View, and Projection Matrices

- The **model matrix** \(M\) applies translation, rotation, and scaling to convert object-space coordinates into world-space coordinates.
- The **view matrix** \(V\) represents the camera; it is often constructed using a `lookAt(eye, target, up)` function.
- The **projection matrix** \(P\) converts 3D coordinates into clip space, using either:
  - **Perspective projection** (objects further away appear smaller).
  - **Orthographic projection** (no perspective foreshortening).

The overall transformation for a vertex position \(p\) is:

\[
    p' = P \times V \times M \times p
\]

This combined matrix is commonly called the **Model-View-Projection (MVP)** matrix.

#### 3.3 Perspective and Orthographic Projection

- **Perspective projection** uses a field-of-view angle, aspect ratio, and near/far clipping planes. It mimics how the human eye or a camera perceives depth.
- **Orthographic projection** uses left/right, top/bottom, and near/far planes to define a box-shaped viewing volume. Objects retain their size regardless of distance from the camera.

Both projection types are implemented in this project and can be switched interactively.

#### 3.4 Lighting and Shading

The project implements simple **per-vertex lighting** using:

- **Ambient lighting** – constant base brightness that simulates indirect light.
- **Diffuse lighting** – depends on the angle between the surface normal and the light direction.

For each vertex, the lighting intensity is approximated as:

\[
    I = I_\text{ambient} + I_\text{diffuse} \max(0, \mathbf{n} \cdot (-\mathbf{L}))
\]

where:

- \(\mathbf{n}\) is the (normalised) surface normal.
- \(\mathbf{L}\) is the (normalised) light direction vector.
- \(I_\text{ambient}\) and \(I_\text{diffuse}\) are user-controlled intensities.

The final vertex colour is computed in the **vertex shader** and passed to the **fragment shader**.

### 4. System Design and Implementation

#### 4.1 Technologies Used

- **HTML5** – Defines the user interface structure and the `<canvas>` element for WebGL.
- **CSS3** – Provides a modern, dark-themed layout suitable for demonstrations.
- **JavaScript (ES6)** – Implements all graphics logic, matrix operations, and event handling.
- **WebGL** – Low-level graphics API used to draw the 3D cube and axes.

No external libraries or frameworks are used; all matrix math and WebGL code are written manually.

#### 4.2 Application Structure

- `index.html` – Contains:
  - A `<canvas>` element with id `glCanvas` for WebGL rendering.
  - A control panel with:
    - Sliders for rotation (X/Y/Z), translation (X/Y/Z), scaling, field of view, and camera distance.
    - A dropdown to select the projection type (Perspective/Orthographic).
    - Checkboxes and sliders for lighting (enable, ambient, diffuse).
  - Informational sections describing learning goals and the current MVP matrix.

- `styles.css` – Styles the layout into:
  - A left panel for the canvas.
  - A right panel for controls.
  - A bottom area with explanatory text and the matrix display.

- `main.js` – Handles:
  - WebGL context creation and shader compilation.
  - Buffer and attribute setup for:
    - A coloured cube with face normals.
    - RGB axes (X = red, Y = green, Z = blue).
  - Matrix utility functions:
    - Identity, translation, scaling, rotations (X/Y/Z).
    - Perspective and orthographic projection.
    - `lookAt` camera matrix.
  - Rendering loop (`render()`):
    - Updates viewport size.
    - Computes model, view, and projection matrices from UI state.
    - Sends matrices and lighting parameters to the shaders.
    - Draws axes and cube each frame.
    - Updates the on-screen MVP matrix display.
  - UI logic:
    - Event listeners for sliders, dropdown, and checkbox.
    - A **Reset** button to restore default parameters.

#### 4.3 Shaders

The project uses **one vertex shader** and **one fragment shader**:

- **Vertex shader**:
  - Inputs: position, normal, colour.
  - Uniforms: model, view, projection matrices; lighting parameters.
  - Computes `gl_Position` as \(P \times V \times M \times \text{position}\).
  - Applies ambient + diffuse lighting to the vertex colour.

- **Fragment shader**:
  - Receives the interpolated colour from the vertex shader.
  - Outputs the final pixel colour.

This simple shader pair demonstrates the programmable pipeline in modern graphics APIs.

### 5. User Guide

#### 5.1 Running the Application

1. Open `index.html` in a web browser that supports WebGL (e.g. Chrome, Edge, Firefox).
2. Alternatively, on a Unix‑like system, run:
   - `make run`

#### 5.2 Using the Controls

- **Model Transformations**
  - Rotate X/Y/Z: Adjust the angles of rotation around each axis.
  - Uniform Scale: Increase or decrease the overall size of the cube.
  - Translate X/Y/Z: Move the cube in 3D space.

- **Camera & Projection**
  - Projection: Switch between **Perspective** and **Orthographic**.
  - Field of View: Controls the “zoom” of the perspective projection.
  - Camera Distance: Moves the camera closer or further from the scene.

- **Lighting**
  - Enable Lighting: Turn basic shading on or off.
  - Ambient Intensity: Adjust base brightness.
  - Diffuse Intensity: Adjust how strongly surfaces respond to the light.

As these parameters change, the **MVP matrix** display updates to show how the underlying transformation matrix is affected.

### 6. Testing and Validation

The application was tested with the following checks:

- **Rendering correctness**
  - Cube and axes appear with the expected colours.
  - Rotations produce intuitive motion around the X, Y, and Z axes.
  - Scaling uniformly grows or shrinks the cube.
  - Translations move the cube without distorting its shape.

- **Projection behaviour**
  - In **Perspective** mode, distant objects appear smaller.
  - In **Orthographic** mode, object size remains constant with distance.

- **Lighting behaviour**
  - With lighting disabled, faces use their base colours.
  - With lighting enabled, faces facing the light are brighter.
  - Changing ambient and diffuse intensities produces visible changes.

- **User interface**
  - All sliders, dropdowns, and the reset button respond correctly.
  - The layout adapts reasonably on smaller screen sizes.

### 7. How this supports learning in computer graphics and geometry

This project supports learning outcomes in computer graphics and geometry as follows:

- **Principles and applications of computer graphics**  
  The report and tool demonstrate the main stages of the graphics pipeline and show how transformations and lighting are applied in practice.

- **Mathematical foundations for transformations, projections, and viewing**  
  The project explicitly uses 4×4 matrices, homogeneous coordinates, `lookAt` view matrix, and both perspective and orthographic projection. The MVP matrix is displayed to reinforce the math.

- **Implementation of 3D transformations, lighting, and shading**  
  The code implements 3D transformations and basic lighting/shading. (Texture mapping is not included to keep the project focused and concise, but could be added as an extension.)

- **Interactive graphical application using a modern graphics API**  
  The implementation uses **WebGL**, which is the JavaScript binding of OpenGL ES 2.0, and follows the same concepts as OpenGL (shaders, buffers, vertex attributes).

- **Applying visualisation techniques in an educational interface**  
  The application provides a clear **interactive user interface** where users directly manipulate transformation and lighting parameters and observe graphical changes.

### 8. Conclusion and Possible Extensions

This project successfully implements a **graphics-based educational tool** that helps students bridge the gap between the mathematics of computer graphics and real-time rendering in a graphics API. By interacting with the controls, users can develop an intuitive understanding of how model, view, and projection matrices affect the final image, and how simple lighting models change the appearance of objects.

Possible extensions include:

- Adding **texture mapping** to the cube surfaces.
- Implementing **specular highlights** for more advanced lighting.
- Allowing the user to move the camera freely with the mouse.
- Visualising additional objects or importing simple 3D models.

Even in its current form, the application provides a solid, demonstrable project that aligns well with typical learning goals in **computer graphics and 3D geometry**.

