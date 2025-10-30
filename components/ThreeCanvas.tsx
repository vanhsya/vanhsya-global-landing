import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { MousePosition } from '../types';

interface ThreeCanvasProps {
  mousePosition: MousePosition;
}

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ mousePosition }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef(mousePosition);

  useEffect(() => {
    mouseRef.current = mousePosition;
  }, [mousePosition]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const clock = new THREE.Clock();
    let logoMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    let mistParticles: THREE.Points;
    let sparkleParticles: THREE.Points;
    let plexusLines: THREE.LineSegments;
    let plexusPoints: THREE.Points;
    const PLEXUS_POINT_COUNT = 150;
    const PLEXUS_CONNECTION_DISTANCE = 3.5;

    const targetMouse = new THREE.Vector2();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform sampler2D u_texture;
      varying vec2 vUv;
      
      // Simplex 2D noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }


      void main() {
        vec4 textureColor = texture2D(u_texture, vUv);
        float revealFactor = smoothstep(0.0, 1.0, (u_time * 0.3) - vUv.x * 1.5);
        
        vec3 finalColor = vec3(0.0);
        float finalAlpha = 0.0;
        
        if (textureColor.a > 0.1) {
            // "VANHSYA" - Liquid Gold Effect
            if (vUv.y > 0.4) {
                vec2 noiseCoord1 = vUv * vec2(1.5, 3.0) + vec2(0.0, u_time * 0.2);
                vec2 noiseCoord2 = vUv * vec2(4.0, 8.0) - vec2(u_time * 0.1, 0.0);
                
                float noise1 = snoise(noiseCoord1) * 0.5 + 0.5;
                float noise2 = snoise(noiseCoord2) * 0.5 + 0.5;
                
                vec3 color1 = vec3(0.9, 0.6, 0.1); // Rich dark gold
                vec3 color2 = vec3(1.0, 0.9, 0.6); // Shimmering light gold
                
                float mixedNoise = pow(noise1, 2.0) + pow(noise2, 3.0) * 0.5;
                vec3 mixedColor = mix(color1, color2, mixedNoise);

                // Add sharper highlights
                float highlight = smoothstep(0.8, 0.9, noise2);
                mixedColor += vec3(1.0, 1.0, 0.95) * highlight;
                
                finalColor = mixedColor;
                finalAlpha = textureColor.a * revealFactor;
            } 
            // "GLOBAL" - Pulsing Shimmer Effect
            else {
                float pulse = 0.7 + (sin(u_time * 4.0 + vUv.x * 20.0) * 0.5 + 0.5) * 0.3;
                float shimmer = sin(vUv.y * 10.0 - u_time * 5.0) * 0.5 + 0.5;
                shimmer = pow(shimmer, 10.0);

                vec3 baseColor = vec3(0.9, 0.7, 1.0); // Light Lilac
                vec3 shimmerColor = vec3(1.0, 1.0, 1.0) * shimmer * 0.8;
                
                finalColor = baseColor * pulse + shimmerColor;
                finalAlpha = textureColor.a * revealFactor;
            }
        }

        gl_FragColor = vec4(finalColor, min(1.0, finalAlpha));
      }
    `;

    // Create Logo with Shader Material
    const createLogo = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 384; 
        const context = canvas.getContext('2d')!;
        
        context.font = 'bold 160px Cinzel';
        context.fillStyle = '#f0e6ff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(255, 200, 255, 0.7)';
        context.shadowBlur = 20;
        context.fillText('VANHSYA', 512, 140);

        context.shadowBlur = 10;
        context.font = '45px Inter';
        context.fillStyle = '#f0e6ff';
        context.letterSpacing = '15px';
        context.fillText('G L O B A L', 512, 290);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0.0 },
                u_texture: { value: texture },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
        });
        const geometry = new THREE.PlaneGeometry(12, 4.5);
        logoMesh = new THREE.Mesh(geometry, material);
        scene.add(logoMesh);
    };
    
    // Create Particle Mist
    const createMist = () => {
        const particleCount = 20000;
        const positions = new Float32Array(particleCount * 3);
        const geometry = new THREE.BufferGeometry();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 50;
            positions[i3 + 1] = (Math.random() - 0.5) * 30;
            positions[i3 + 2] = (Math.random() - 0.5) * 20 - 20;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xda70d6, // Orchid
            size: 0.05,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.5,
        });

        mistParticles = new THREE.Points(geometry, material);
        scene.add(mistParticles);
    };

    // Create Interactive Sparkles
    const createSparkles = () => {
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const geometry = new THREE.BufferGeometry();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = originalPositions[i3] = (Math.random() - 0.5) * 30;
            positions[i3 + 1] = originalPositions[i3 + 1] = (Math.random() - 0.5) * 20;
            positions[i3 + 2] = originalPositions[i3 + 2] = (Math.random() - 0.5) * 10;
            velocities[i3] = 0;
            velocities[i3+1] = 0;
            velocities[i3+2] = 0;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8,
        });
        sparkleParticles = new THREE.Points(geometry, material);
        scene.add(sparkleParticles);
    }

    // Create Fluid Plexus
    const createPlexus = () => {
        const pointsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PLEXUS_POINT_COUNT * 3);
        const velocities = new Float32Array(PLEXUS_POINT_COUNT * 3);

        for (let i = 0; i < PLEXUS_POINT_COUNT; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 40;
            positions[i3 + 1] = (Math.random() - 0.5) * 25;
            positions[i3 + 2] = (Math.random() - 0.5) * 20 - 5;
            
            velocities[i3] = (Math.random() - 0.5) * 0.01;
            velocities[i3+1] = (Math.random() - 0.5) * 0.01;
            velocities[i3+2] = 0; // No Z movement for now
        }

        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pointsGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const pointsMaterial = new THREE.PointsMaterial({
            color: 0xADD8E6, // Light Blue
            size: 0.08,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.7
        });

        plexusPoints = new THREE.Points(pointsGeometry, pointsMaterial);
        scene.add(plexusPoints);

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x87CEEB, // Sky blue
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        plexusLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(plexusLines);
    };
    
    createLogo();
    createMist();
    createSparkles();
    createPlexus();

    const animate = () => {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Animate Logo Shader
        logoMesh.material.uniforms.u_time.value = time;
        logoMesh.position.y = Math.sin(time * 0.5) * 0.2;
        logoMesh.rotation.y = Math.sin(time * 0.3) * 0.05;

        // Animate Mist
        mistParticles.rotation.y = time * 0.02;

        // Animate Sparkles with new physics
        const sPositions = sparkleParticles.geometry.attributes.position.array as Float32Array;
        const sOriginalPositions = sparkleParticles.geometry.attributes.originalPosition.array as Float32Array;
        const sVelocities = sparkleParticles.geometry.attributes.velocity.array as Float32Array;
        
        targetMouse.lerp(mouseRef.current, 0.05);

        const INTERACTION_RADIUS = 4;
        const DAMPING = 0.95;
        const RETURN_FORCE = 0.0005;

        for (let i = 0; i < (sPositions.length / 3); i++) {
            const i3 = i * 3;
            
            const dx = targetMouse.x * 10 - sPositions[i3];
            const dy = targetMouse.y * 10 - sPositions[i3+1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < INTERACTION_RADIUS) {
                const force = (INTERACTION_RADIUS - dist) * 0.01;
                sVelocities[i3] -= (dx / dist) * force;
                sVelocities[i3+1] -= (dy / dist) * force;
                sVelocities[i3] += (dy / dist) * force * 0.3;
                sVelocities[i3+1] -= (dx / dist) * force * 0.3;
            }

            sVelocities[i3] += (sOriginalPositions[i3] - sPositions[i3]) * RETURN_FORCE;
            sVelocities[i3+1] += (sOriginalPositions[i3+1] - sPositions[i3+1]) * RETURN_FORCE;
            sVelocities[i3] *= DAMPING;
            sVelocities[i3+1] *= DAMPING;
            sPositions[i3] += sVelocities[i3];
            sPositions[i3+1] += sVelocities[i3+1];
        }
        sparkleParticles.geometry.attributes.position.needsUpdate = true;
        
        // Animate Plexus
        const pPositions = plexusPoints.geometry.attributes.position.array as Float32Array;
        const pVelocities = plexusPoints.geometry.attributes.velocity.array as Float32Array;
        const linePositions: number[] = [];

        for(let i = 0; i < PLEXUS_POINT_COUNT; i++) {
            const i3 = i * 3;
            pPositions[i3] += pVelocities[i3];
            pPositions[i3+1] += pVelocities[i3+1];
            
            if (pPositions[i3] > 20 || pPositions[i3] < -20) pVelocities[i3] *= -1;
            if (pPositions[i3+1] > 12.5 || pPositions[i3+1] < -12.5) pVelocities[i3+1] *= -1;

            for(let j = i + 1; j < PLEXUS_POINT_COUNT; j++) {
                const j3 = j * 3;
                const dx = pPositions[i3] - pPositions[j3];
                const dy = pPositions[i3+1] - pPositions[j3+1];
                const dz = pPositions[i3+2] - pPositions[j3+2];
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (dist < PLEXUS_CONNECTION_DISTANCE) {
                    linePositions.push(pPositions[i3], pPositions[i3+1], pPositions[i3+2]);
                    linePositions.push(pPositions[j3], pPositions[j3+1], pPositions[j3+2]);
                }
            }
        }
        plexusPoints.geometry.attributes.position.needsUpdate = true;
        plexusLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        plexusLines.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    };
    animate();

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    return () => {
        window.removeEventListener('resize', onWindowResize);
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none" />;
};

export default ThreeCanvas;