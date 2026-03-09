// Interactive 3D Transformations Tutor
// Raw WebGL, no external 3D engine.

let gl;
let program;

let attribLocations = {};
let uniformLocations = {};

// Cube buffers
let cubePosBuffer = null;
let cubeNormalBuffer = null;
let cubeColorBuffer = null;
let cubeIndexBuffer = null;
let cubeIndexCount = 0;

// Axis buffers
let axisPosBuffer = null;
let axisNormalBuffer = null;
let axisColorBuffer = null;

const state = {
  rotX: 30,
  rotY: 40,
  rotZ: 0,
  scale: 1.0,
  transX: 0.0,
  transY: 0.0,
  transZ: -3.0,
  projectionType: "perspective",
  fov: 60,
  camDist: 8.0,
  lightingEnabled: true,
  ambient: 0.3,
  diffuse: 0.7,
  autoRotate: true,
};

let lastTimeSeconds = 0;
let autoRotateAngle = 0;
const AUTO_ROTATE_SPEED_DEG_PER_SEC = 20;

// ---------- Matrix / Vector utilities ----------

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Multiply(a, b) {
  const out = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col + row * 4] =
        a[row * 4 + 0] * b[col + 0] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }
  return out;
}

function mat4Translate(tx, ty, tz) {
  const m = mat4Identity();
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  return m;
}

function mat4Scale(sx, sy, sz) {
  const m = mat4Identity();
  m[0] = sx;
  m[5] = sy;
  m[10] = sz;
  return m;
}

function mat4RotateX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function mat4RotateY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

function mat4RotateZ(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Perspective(fovDeg, aspect, near, far) {
  const fovRad = degToRad(fovDeg);
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  const out = new Array(16).fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4Ortho(left, right, bottom, top, near, far) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  const out = mat4Identity();
  out[0] = -2 * lr;
  out[5] = -2 * bt;
  out[10] = 2 * nf;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  return out;
}

function vec3Normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function mat4LookAt(eye, target, up) {
  const z = vec3Normalize([
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  ]);
  const x = vec3Normalize([
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ]);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];

  const out = mat4Identity();
  out[0] = x[0];
  out[1] = y[0];
  out[2] = z[0];
  out[4] = x[1];
  out[5] = y[1];
  out[6] = z[1];
  out[8] = x[2];
  out[9] = y[2];
  out[10] = z[2];
  out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
  out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
  out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
  return out;
}

function formatMatrix4(m) {
  const rows = [];
  for (let r = 0; r < 4; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      row.push(m[c + r * 4].toFixed(2).padStart(6));
    }
    rows.push(row.join("  "));
  }
  return rows.join("\n");
}

// ---------- WebGL setup ----------

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function initGL() {
  const canvas = document.getElementById("glCanvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported in this browser.");
    return;
  }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProj;

    uniform bool uLightingEnabled;
    uniform vec3 uLightDir;
    uniform float uAmbient;
    uniform float uDiffuse;

    varying vec3 vColor;

    void main() {
      mat4 mv = uView * uModel;
      gl_Position = uProj * mv * vec4(aPosition, 1.0);

      if (!uLightingEnabled) {
        vColor = aColor;
      } else {
        vec3 normal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
        float nDotL = max(dot(normal, -uLightDir), 0.0);
        float intensity = uAmbient + uDiffuse * nDotL;
        vColor = aColor * intensity;
      }
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  program = createProgram(gl, vertexSource, fragmentSource);
  gl.useProgram(program);

  attribLocations.position = gl.getAttribLocation(program, "aPosition");
  attribLocations.normal = gl.getAttribLocation(program, "aNormal");
  attribLocations.color = gl.getAttribLocation(program, "aColor");

  uniformLocations.model = gl.getUniformLocation(program, "uModel");
  uniformLocations.view = gl.getUniformLocation(program, "uView");
  uniformLocations.proj = gl.getUniformLocation(program, "uProj");
  uniformLocations.lightingEnabled = gl.getUniformLocation(
    program,
    "uLightingEnabled"
  );
  uniformLocations.lightDir = gl.getUniformLocation(program, "uLightDir");
  uniformLocations.ambient = gl.getUniformLocation(program, "uAmbient");
  uniformLocations.diffuse = gl.getUniformLocation(program, "uDiffuse");

  initCubeGeometry();
  initAxisGeometry();

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.01, 0.01, 0.05, 1.0);

  initUI();
  requestAnimationFrame(render);
}

// ---------- Geometry ----------

function initCubeGeometry() {
  const positions = [
    // Front
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    // Back
    -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
    // Top
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
    // Bottom
    -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
    // Right
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    // Left
    -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
  ];

  const normals = [
    // Front
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ];

  const colors = [
    // Front - orange
    1, 0.6, 0.2, 1, 0.6, 0.2, 1, 0.6, 0.2, 1, 0.6, 0.2,
    // Back - purple
    0.6, 0.4, 1, 0.6, 0.4, 1, 0.6, 0.4, 1, 0.6, 0.4, 1,
    // Top - teal
    0.2, 0.9, 0.8, 0.2, 0.9, 0.8, 0.2, 0.9, 0.8, 0.2, 0.9, 0.8,
    // Bottom - red
    0.95, 0.3, 0.3, 0.95, 0.3, 0.3, 0.95, 0.3, 0.3, 0.95, 0.3, 0.3,
    // Right - blue
    0.3, 0.5, 0.95, 0.3, 0.5, 0.95, 0.3, 0.5, 0.95, 0.3, 0.5, 0.95,
    // Left - green
    0.4, 0.95, 0.4, 0.4, 0.95, 0.4, 0.4, 0.95, 0.4, 0.4, 0.95, 0.4,
  ];

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  cubeIndexCount = indices.length;

  cubePosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.position);
  gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);

  cubeNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.normal);
  gl.vertexAttribPointer(attribLocations.normal, 3, gl.FLOAT, false, 0, 0);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.color);
  gl.vertexAttribPointer(attribLocations.color, 3, gl.FLOAT, false, 0, 0);

  cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

function initAxisGeometry() {
  const positions = [
    0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4,
  ];

  const normals = [
    1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,
  ];

  const colors = [
    1, 0.3, 0.3, 1, 0.1, 0.1, 0.3, 1, 0.3, 0.1, 1, 0.1, 0.3, 0.9, 1, 0.1, 0.4,
    1,
  ];

  axisPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, axisPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.position);
  gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);

  axisNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, axisNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.normal);
  gl.vertexAttribPointer(attribLocations.normal, 3, gl.FLOAT, false, 0, 0);

  axisColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocations.color);
  gl.vertexAttribPointer(attribLocations.color, 3, gl.FLOAT, false, 0, 0);
}

// ---------- UI ----------

function initUI() {
  const bindSlider = (id, key, formatter) => {
    const input = document.getElementById(id);
    const label = document.getElementById(id + "Val");
    const format = formatter || ((v) => v);

    const update = () => {
      const val = parseFloat(input.value);
      state[key] = val;
      if (label) label.textContent = format(val);
    };

    input.addEventListener("input", update);
    update();
  };

  bindSlider("rotX", "rotX", (v) => v.toFixed(0));
  bindSlider("rotY", "rotY", (v) => v.toFixed(0));
  bindSlider("rotZ", "rotZ", (v) => v.toFixed(0));
  bindSlider("scale", "scale", (v) => v.toFixed(1));
  bindSlider("transX", "transX", (v) => v.toFixed(1));
  bindSlider("transY", "transY", (v) => v.toFixed(1));
  bindSlider("transZ", "transZ", (v) => v.toFixed(1));
  bindSlider("fov", "fov", (v) => v.toFixed(0));
  bindSlider("camDist", "camDist", (v) => v.toFixed(1));
  bindSlider("ambient", "ambient", (v) => v.toFixed(2));
  bindSlider("diffuse", "diffuse", (v) => v.toFixed(2));

  const projectionSelect = document.getElementById("projectionType");
  projectionSelect.value = state.projectionType;
  projectionSelect.addEventListener("change", () => {
    state.projectionType = projectionSelect.value;
  });

  const lightCheckbox = document.getElementById("lightingEnabled");
  lightCheckbox.checked = state.lightingEnabled;
  lightCheckbox.addEventListener("change", () => {
    state.lightingEnabled = lightCheckbox.checked;
  });

  const autoRotateCheckbox = document.getElementById("autoRotate");
  if (autoRotateCheckbox) {
    autoRotateCheckbox.checked = state.autoRotate;
    autoRotateCheckbox.addEventListener("change", () => {
      state.autoRotate = autoRotateCheckbox.checked;
    });
  }

  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", resetState);
}

function resetState() {
  state.rotX = 30;
  state.rotY = 40;
  state.rotZ = 0;
  state.scale = 1.0;
  state.transX = 0.0;
  state.transY = 0.0;
  state.transZ = -3.0;
  state.projectionType = "perspective";
  state.fov = 60;
  state.camDist = 8.0;
  state.lightingEnabled = true;
  state.ambient = 0.3;
  state.diffuse = 0.7;
  state.autoRotate = true;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = String(val);
  };

  setVal("rotX", state.rotX);
  setVal("rotY", state.rotY);
  setVal("rotZ", state.rotZ);
  setVal("scale", state.scale);
  setVal("transX", state.transX);
  setVal("transY", state.transY);
  setVal("transZ", state.transZ);
  setVal("fov", state.fov);
  setVal("camDist", state.camDist);
  setVal("ambient", state.ambient);
  setVal("diffuse", state.diffuse);

  document.getElementById("projectionType").value = state.projectionType;
  document.getElementById("lightingEnabled").checked = state.lightingEnabled;
  const autoRotateCheckbox = document.getElementById("autoRotate");
  if (autoRotateCheckbox) autoRotateCheckbox.checked = state.autoRotate;

  initUI();
}

// ---------- Rendering ----------

function render(timeMs) {
  if (!gl) return;

  const timeSeconds = timeMs * 0.001;
  const delta = lastTimeSeconds ? timeSeconds - lastTimeSeconds : 0;
  lastTimeSeconds = timeSeconds;

  if (state.autoRotate) {
    autoRotateAngle += AUTO_ROTATE_SPEED_DEG_PER_SEC * delta;
  }

  const canvas = gl.canvas;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;

  let proj;
  if (state.projectionType === "perspective") {
    proj = mat4Perspective(state.fov, aspect, 0.1, 100);
  } else {
    const s = 4;
    proj = mat4Ortho(-s * aspect, s * aspect, -s, s, 0.1, 100);
  }

  const eye = [state.camDist, state.camDist * 0.5, state.camDist];
  const view = mat4LookAt(eye, [0, 0, 0], [0, 1, 0]);

  const animatedRotX = state.rotX;
  const animatedRotY = state.rotY + autoRotateAngle;
  const animatedRotZ = state.rotZ;

  let model = mat4Identity();
  model = mat4Multiply(model, mat4Translate(state.transX, state.transY, state.transZ));
  model = mat4Multiply(model, mat4RotateX(degToRad(animatedRotX)));
  model = mat4Multiply(model, mat4RotateY(degToRad(animatedRotY)));
  model = mat4Multiply(model, mat4RotateZ(degToRad(animatedRotZ)));
  model = mat4Multiply(model, mat4Scale(state.scale, state.scale, state.scale));

  const mvp = mat4Multiply(mat4Multiply(model, view), proj);
  const matrixDisplay = document.getElementById("mvpMatrixDisplay");
  if (matrixDisplay) {
    matrixDisplay.textContent = formatMatrix4(mvp);
  }

  gl.useProgram(program);
  gl.uniformMatrix4fv(uniformLocations.model, false, new Float32Array(model));
  gl.uniformMatrix4fv(uniformLocations.view, false, new Float32Array(view));
  gl.uniformMatrix4fv(uniformLocations.proj, false, new Float32Array(proj));
  gl.uniform1i(uniformLocations.lightingEnabled, state.lightingEnabled ? 1 : 0);

  const lightDir = vec3Normalize([1, 1, 0.5]);
  gl.uniform3fv(uniformLocations.lightDir, new Float32Array(lightDir));
  gl.uniform1f(uniformLocations.ambient, state.ambient);
  gl.uniform1f(uniformLocations.diffuse, state.diffuse);

  // Draw axes (lines)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisPosBuffer);
  gl.enableVertexAttribArray(attribLocations.position);
  gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, axisNormalBuffer);
  gl.enableVertexAttribArray(attribLocations.normal);
  gl.vertexAttribPointer(attribLocations.normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.enableVertexAttribArray(attribLocations.color);
  gl.vertexAttribPointer(attribLocations.color, 3, gl.FLOAT, false, 0, 0);

  gl.lineWidth(2.0);
  gl.drawArrays(gl.LINES, 0, 6);

  // Draw cube (triangles)
  gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuffer);
  gl.enableVertexAttribArray(attribLocations.position);
  gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.enableVertexAttribArray(attribLocations.normal);
  gl.vertexAttribPointer(attribLocations.normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.enableVertexAttribArray(attribLocations.color);
  gl.vertexAttribPointer(attribLocations.color, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeIndexCount, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
}

window.addEventListener("DOMContentLoaded", initGL);

