const background = document.querySelector("#auth-background");

if (background) {
  initializeBackground();
}

async function initializeBackground() {
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

          // Neutral palette matching the shop: the page grey (#efefef),
          // white highlights, a cool grey, a soft stone and a faint ink ribbon.
          vec3 color = vec3(0.937, 0.937, 0.937);
          color = mix(color, vec3(0.995, 0.995, 0.995), clamp(mint * 0.85, 0.0, 0.85));
          color = mix(color, vec3(0.85, 0.865, 0.885), clamp(aqua * 0.7, 0.0, 0.7));
          color = mix(color, vec3(0.91, 0.865, 0.81), clamp(warm * 0.6, 0.0, 0.6));
          color = mix(color, vec3(0.80, 0.80, 0.80), clamp(ribbon * 0.2, 0.0, 0.2));

          float texture = (noise(point * 4.0 + vec2(time * 0.06)) - 0.5) * 0.012;
          color += vec3(texture);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    camera.position.z = 1;
    renderer.setClearColor(0xefefef, 1);
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


    resize();
    start();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", start);
    motionQuery.addEventListener("change", start);
  } catch {
    background.classList.add("auth-background--fallback");
  }
}
