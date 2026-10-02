const background = document.querySelector("#auth-background");

if (background) {
  initializeBackground();
}

async function initializeBackground() {
  const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  try {
    const THREE =
      await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uDark: { value: themeQuery.matches ? 1 : 0 },
    };

    const material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uDark;
        varying vec2 vUv;

        float hash(vec2 point) {
          point = fract(point * vec2(123.34, 456.21));
          point += dot(point, point + 45.32);
          return fract(point.x * point.y);
        }

        float noise(vec2 point) {
          vec2 cell = floor(point);
          vec2 local = fract(point);
          local = local * local * (3.0 - 2.0 * local);
          float lower = mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x);
          float upper = mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x);
          return mix(lower, upper, local.y);
        }

        float glow(vec2 point, vec2 center, float spread) {
          vec2 offset = point - center;
          return exp(-dot(offset, offset) * spread);
        }

        void main() {
          float time = uTime;
          vec2 point = (gl_FragCoord.xy / uResolution - 0.5)
            * vec2(uResolution.x / uResolution.y, 1.0);
          float flow = noise(point * 2.1 + vec2(time * 0.18, -time * 0.14));
          point += vec2(
            sin(point.y * 2.0 + time * 0.3),
            cos(point.x * 1.8 - time * 0.26)
          ) * 0.075;
          float openSide = smoothstep(-0.04, 0.42, point.x);

          vec2 mintCenter = vec2(
            0.24 + 0.25 * sin(time * 0.52),
            0.27 + 0.21 * cos(time * 0.46)
          );
          vec2 aquaCenter = vec2(
            0.32 + 0.27 * cos(time * 0.45 + 0.8),
            -0.12 + 0.24 * sin(time * 0.55)
          );
          vec2 warmCenter = vec2(
            0.38 + 0.2 * sin(time * 0.4 + 1.4),
            -0.5 + 0.22 * cos(time * 0.48)
          );

          float mint = glow(point, mintCenter, 3.0) * (0.92 + flow * 0.12) * openSide;
          float aqua = glow(point, aquaCenter, 3.6) * (0.9 + flow * 0.16) * openSide;
          float warm = glow(point, warmCenter, 4.2) * (0.88 + flow * 0.16) * openSide;
          float ribbon = exp(-pow(point.y - (0.12 + 0.2 * sin(point.x * 1.8 + time * 0.42)), 2.0) * 4.0) * openSide;

          vec3 lightColor = vec3(0.982, 0.991, 0.986);
          lightColor = mix(lightColor, vec3(0.58, 0.88, 0.70), clamp(mint * 0.78, 0.0, 0.78));
          lightColor = mix(lightColor, vec3(0.6, 0.84, 0.92), clamp(aqua * 0.62, 0.0, 0.64));
          lightColor = mix(lightColor, vec3(0.98, 0.76, 0.58), clamp(warm * 0.46, 0.0, 0.5));
          lightColor = mix(lightColor, vec3(0.76, 0.89, 0.72), clamp(ribbon * 0.2, 0.0, 0.22));

          vec3 darkColor = vec3(0.018, 0.031, 0.026);
          darkColor = mix(darkColor, vec3(0.04, 0.3, 0.16), clamp(mint * 0.9, 0.0, 0.86));
          darkColor = mix(darkColor, vec3(0.035, 0.19, 0.28), clamp(aqua * 0.78, 0.0, 0.72));
          darkColor = mix(darkColor, vec3(0.3, 0.15, 0.075), clamp(warm * 0.56, 0.0, 0.5));
          darkColor = mix(darkColor, vec3(0.035, 0.22, 0.13), clamp(ribbon * 0.28, 0.0, 0.3));

          float texture = (noise(point * 4.0 + vec2(time * 0.06)) - 0.5) * 0.012;
          vec3 color = mix(lightColor, darkColor, uDark);
          color += vec3(texture);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    camera.position.z = 1;
    renderer.setClearColor(themeQuery.matches ? 0x07110d : 0xf8fbf9, 1);
    renderer.domElement.setAttribute("aria-hidden", "true");
    background.replaceChildren(renderer.domElement);

    let frameId = 0;

    function resize() {
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 600 ? 1.25 : 1.5,
      );
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      draw(performance.now());
    }

    function draw(time) {
      uniforms.uTime.value = motionQuery.matches ? 0 : time * 0.001;
      renderer.render(scene, camera);
    }

    function animate(time) {
      frameId = 0;
      if (document.hidden) return;
      draw(time);
      if (!motionQuery.matches) {
        frameId = window.requestAnimationFrame(animate);
      }
    }

    function start() {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      if (motionQuery.matches) {
        draw(0);
      } else if (!document.hidden) {
        frameId = window.requestAnimationFrame(animate);
      }
    }

    function updateTheme() {
      uniforms.uDark.value = themeQuery.matches ? 1 : 0;
      renderer.setClearColor(themeQuery.matches ? 0x07110d : 0xf8fbf9, 1);
      draw(performance.now());
    }

    resize();
    start();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", start);
    themeQuery.addEventListener("change", updateTheme);
    motionQuery.addEventListener("change", start);
  } catch {
    background.classList.add("auth-background--fallback");
  }
}
