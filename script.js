import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    // --- LOADER ---
    const loader = document.getElementById('loader');
    const mainContainer = document.getElementById('main-container');
    mainContainer.style.visibility = 'hidden';

    window.addEventListener('load', () => {
        gsap.to(loader, {
            opacity: 0,
            duration: 0.5,
            delay: 1.5,
            onComplete: () => {
                loader.style.display = 'none';
                mainContainer.style.visibility = 'visible';
                initPage();
            }
        });
        gsap.to(".loader-bar", {
            width: "100%",
            duration: 1.5,
            ease: "power2.inOut"
        });
    });

    let locomotiveScrollInstance = null; // To store the scroll instance

    function initPage() {
        // --- LOCOMOTIVE SCROLL ---
        locomotiveScrollInstance = new LocomotiveScroll({ // Assign to the outer scope variable
            el: document.querySelector('[data-scroll-container]'),
            smooth: true,
            lerp: 0.08,
            multiplier: 1,
            tablet: { smooth: true },
            smartphone: { smooth: true }
        });

        locomotiveScrollInstance.on('scroll', ScrollTrigger.update);

        ScrollTrigger.scrollerProxy('[data-scroll-container]', {
            scrollTop(value) {
                return arguments.length ? locomotiveScrollInstance.scrollTo(value, {duration:0, disableLerp:true}) : locomotiveScrollInstance.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: document.querySelector('[data-scroll-container]').style.transform ? 'transform' : 'fixed'
        });

        ScrollTrigger.addEventListener('refresh', () => locomotiveScrollInstance.update());
        ScrollTrigger.refresh();

        // --- SCROLL DOWN BUTTON FUNCTIONALITY ---
        const scrollDownButton = document.getElementById('scroll-down-button');
        if (scrollDownButton) {
            scrollDownButton.addEventListener('click', () => {
                const targetElement = scrollDownButton.dataset.scrollTo; // e.g., "#about"
                if (targetElement && locomotiveScrollInstance) {
                    locomotiveScrollInstance.scrollTo(targetElement);
                }
            });
        }


        // --- NAVBAR STICKY EFFECT ---
        const navbar = document.getElementById('navbar');
        ScrollTrigger.create({
            trigger: "body",
            start: "top -100px",
            scroller: "[data-scroll-container]",
            toggleClass: { targets: navbar, className: "scrolled" },
        });


        // --- THEME TOGGLE ---
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        const threeCanvas = document.getElementById('three-canvas'); 
        const sunIcon = '<i class="fas fa-sun"></i>';
        const moonIcon = '<i class="fas fa-moon"></i>';

        const savedTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;
        threeCanvas.style.opacity = getComputedStyle(body).getPropertyValue('--three-particle-opacity').trim();
        threeCanvas.style.mixBlendMode = getComputedStyle(body).getPropertyValue('--three-mix-blend-mode').trim();


        themeToggle.addEventListener('click', () => {
            let currentTheme = body.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;

            // Update Three.js canvas style based on new theme's CSS variables
            threeCanvas.style.opacity = getComputedStyle(body).getPropertyValue('--three-particle-opacity').trim();
            threeCanvas.style.mixBlendMode = getComputedStyle(body).getPropertyValue('--three-mix-blend-mode').trim();

            if (typeof threeScene !== 'undefined' && threeScene.updateTheme) {
                threeScene.updateTheme(newTheme);
            }
        });


        // --- GSAP ANIMATIONS ---
        gsap.registerPlugin(ScrollTrigger, TextPlugin);

        const heroTimeline = gsap.timeline({ delay: 0.2 });
        heroTimeline
            .from(".hero-title .word", {
                y: "110%", opacity: 0, rotationZ: "10deg", duration: 1, ease: "power3.out", stagger: 0.1
            })
            .from(".hero-subtitle", {
                duration: 1.5, text: { value: "", delimiter: "" }, ease: "none"
            }, "-=0.5")
            .from(".cta-button", {
                opacity: 0, y: 20, duration: 0.8, ease: "power3.out"
            }, "-=0.8")
            .to(".scroll-down-indicator", {
                opacity: 1, duration: 0.5, ease: "power2.inOut"
            }, "-=0.3");


        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title, scroller: "[data-scroll-container]", start: "top 85%", end: "bottom 20%", toggleClass: "is-inview",
                },
                y: 50, opacity: 0, duration: 0.8, ease: "power3.out"
            });
        });

        gsap.utils.toArray('.anim-paragraph, .content-box, .project-card').forEach(elem => {
            gsap.from(elem, {
                scrollTrigger: {
                    trigger: elem, scroller: "[data-scroll-container]", start: "top 90%", end: "bottom 10%", toggleActions: "play none none none",
                },
                y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.15
            });
        });


        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        const threeScene = initThreeScene();
        if (threeScene && locomotiveScrollInstance) { // Check locomotiveScrollInstance too
            locomotiveScrollInstance.on('scroll', (instance) => {
                if (threeScene.onScroll) {
                    threeScene.onScroll(instance.scroll.y);
                }
            });
        }

        ScrollTrigger.refresh();
    }

    function initThreeScene() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return null;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas, alpha: true, antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const particleCount = 5000;
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        let particleMaterial = new THREE.PointsMaterial({
            size: 0.015,
            color: getComputedStyle(document.body).getPropertyValue('--accent-color').trim(), // Initial color
            transparent: true,
        });
        particleMaterial.blending = THREE.NormalBlending;


        const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particlesMesh);

        camera.position.z = 5;

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        const clock = new THREE.Clock();
        function animate() {
            const elapsedTime = clock.getElapsedTime();
            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.x = elapsedTime * 0.02;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();

        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            gsap.to(camera.position, {
                x: mouseX * 0.3, y: mouseY * 0.3, duration: 1, ease: "power2.out"
            });
            gsap.to(camera.rotation, {
                x: -mouseY * 0.05, y: -mouseX * 0.05, duration: 1, ease: "power2.out"
            });
        });

        return {
            scene, camera, renderer,
            updateTheme: (newTheme) => {
                const newColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
                particleMaterial.color.set(newColor); // Update particle color
                // Opacity and blend mode are now primarily handled by CSS on the canvas element
            },
        };
    }
});