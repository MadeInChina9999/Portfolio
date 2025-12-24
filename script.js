document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. NAVIGATION & SÉCURITÉ
    // ==========================================
    
    const isUnlocked = sessionStorage.getItem('portfolio_unlocked') === 'true';
    const navLinks = document.querySelectorAll('nav a:not(.home-link)');
    const homeLink = document.querySelector('.home-link');
    const isHomePage = homeLink && homeLink.classList.contains('active');

    function updateNavState() {
        const currentlyUnlocked = sessionStorage.getItem('portfolio_unlocked') === 'true';
        navLinks.forEach(link => {
            if (currentlyUnlocked) {
                link.classList.remove('locked');
            } else {
                link.classList.add('locked');
            }
        });
    }

    if (!isUnlocked && !isHomePage) {
        window.location.href = 'index.html'; 
    }

    const lockedOverlay = document.getElementById('locked-notification');
    const closeLockedBtn = document.getElementById('close-locked-btn');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.getAttribute('href');

            if (sessionStorage.getItem('portfolio_unlocked') !== 'true') {
                if(lockedOverlay) {
                    lockedOverlay.style.display = 'flex';
                    const playBtn = document.getElementById('play-btn');
                    if(playBtn) playBtn.style.display = 'none';
                }
            } else {
                document.body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            }
        });
    });

    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (homeLink.classList.contains('active')) return;
            const targetUrl = homeLink.getAttribute('href');
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = targetUrl; }, 300);
        });
    }

    if(closeLockedBtn && lockedOverlay) {
        closeLockedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lockedOverlay.classList.add('closing');
            lockedOverlay.addEventListener('animationend', () => {
                lockedOverlay.style.display = 'none';
                lockedOverlay.classList.remove('closing');
                
                const playBtn = document.getElementById('play-btn');
                if(playBtn) {
                    playBtn.style.display = 'block';     
                    playBtn.classList.add('btn-appear'); 
                    playBtn.addEventListener('animationend', () => playBtn.classList.remove('btn-appear'), { once: true });
                }
            }, { once: true });
        });
    }

    window.unlockSite = function() {
        sessionStorage.setItem('portfolio_unlocked', 'true');
        updateNavState();
        
        const playBtn = document.getElementById('play-btn');
        const gameOverMsg = document.getElementById('game-over-msg');
        const winMsg = document.getElementById('win-msg');
        
        if(playBtn) playBtn.style.display = 'none';
        if(gameOverMsg) gameOverMsg.style.display = 'none';
        if(winMsg) winMsg.style.display = 'none';

        const notification = document.getElementById('unlock-notification');
        if(notification) notification.style.display = 'flex';
    };

    const skipBtns = document.querySelectorAll('.skip-btn');
    skipBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.unlockSite();
        });
    });

    updateNavState();


    // ==========================================
    // 2. JEU SNAKE (Page Accueil)
    // ==========================================
    const canvas = document.getElementById('snake-game');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const playBtn = document.getElementById('play-btn');
        const gameOverMsg = document.getElementById('game-over-msg');
        const winMsg = document.getElementById('win-msg');
        
        const box = 10; 
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        let snake = [];
        let food = {};
        let score = 0;
        let d; 
        let gameLoop; 
        let isPlaying = false;

        const spawnOverlay = document.getElementById('food-spawn-overlay');
        function triggerFoodSpawnAnimation(x, y) {
            if (spawnOverlay) {
                spawnOverlay.style.left = x + 'px';
                spawnOverlay.style.top = y + 'px';
                spawnOverlay.classList.remove('spawning');
                void spawnOverlay.offsetWidth; // Force reflow
                spawnOverlay.classList.add('spawning');
                spawnOverlay.addEventListener('animationend', () => {
                    spawnOverlay.classList.remove('spawning');
                }, { once: true });
            }
        }

        function updateFoodDots(currentScore) {
            const dots = document.querySelectorAll('.food-dot');
            dots.forEach((dot, index) => {
                if (index < currentScore) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if(!isPlaying) return;
            const key = event.keyCode;
            if([37, 38, 39, 40].indexOf(key) > -1) event.preventDefault();
            
            const currentDir = d || "RIGHT";
            let btnId = null;

            if(key == 37) { if(currentDir != "RIGHT") d = "LEFT"; btnId = 'btn-left'; }
            else if(key == 38) { if(currentDir != "DOWN") d = "UP"; btnId = 'btn-up'; }
            else if(key == 39) { if(currentDir != "LEFT") d = "RIGHT"; btnId = 'btn-right'; }
            else if(key == 40) { if(currentDir != "UP") d = "DOWN"; btnId = 'btn-down'; }

            if(btnId) {
                const btn = document.getElementById(btnId);
                if(btn) {
                    btn.classList.add('active-key');
                    setTimeout(() => btn.classList.remove('active-key'), 100);
                }
            }
        });

        const directions = { 'btn-up': 'UP', 'btn-down': 'DOWN', 'btn-left': 'LEFT', 'btn-right': 'RIGHT' };
        for (const [id, dir] of Object.entries(directions)) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(!isPlaying) return;
                    const currentDir = d || "RIGHT";
                    if (dir === 'LEFT' && currentDir !== 'RIGHT') d = 'LEFT';
                    if (dir === 'UP' && currentDir !== 'DOWN') d = 'UP';
                    if (dir === 'RIGHT' && currentDir !== 'LEFT') d = 'RIGHT';
                    if (dir === 'DOWN' && currentDir !== 'UP') d = 'DOWN';
                });
            }
        }

        function initGame() {
            snake = [];
            for(let i = 0; i < 3; i++) {
                snake.push({ x: (10 - i) * box, y: 10 * box });
            }
            
            const newFoodX = Math.floor(Math.random() * (canvasWidth/box)) * box;
            const newFoodY = Math.floor(Math.random() * (canvasHeight/box)) * box;
            food = { x: newFoodX, y: newFoodY };
            triggerFoodSpawnAnimation(newFoodX, newFoodY);
            
            score = 0;
            d = undefined;
            updateFoodDots(score);
            
            playBtn.style.display = 'none';
            gameOverMsg.style.display = 'none';
            winMsg.style.display = 'none';
            
            isPlaying = true;
            if(gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(draw, 80); 
        }

        function draw() {
            ctx.fillStyle = "#011627";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            for (let i = 0; i < snake.length; i++) {
                ctx.fillStyle = (i == 0) ? "#43D9AD" : "#2E7D67";
                ctx.fillRect(snake[i].x, snake[i].y, box, box);
            }

            ctx.fillStyle = "#43D9AD";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#43D9AD";
            ctx.beginPath();
            ctx.arc(food.x + box/2, food.y + box/2, box/2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;

            let snakeX = snake[0].x;
            let snakeY = snake[0].y;

            if (d == "LEFT") snakeX -= box;
            if (d == "UP") snakeY -= box;
            if (d == "RIGHT") snakeX += box;
            if (d == "DOWN") snakeY += box;

            if(!d) return;

            if (snakeX == food.x && snakeY == food.y) {
                score++;
                updateFoodDots(score);
                if (score >= 5) {
                    clearInterval(gameLoop);
                    isPlaying = false;
                    winMsg.style.display = 'block';
                    window.unlockSite();
                    return;
                }
                const newFoodX = Math.floor(Math.random() * (canvasWidth/box)) * box;
                const newFoodY = Math.floor(Math.random() * (canvasHeight/box)) * box;
                food = { x: newFoodX, y: newFoodY };
                triggerFoodSpawnAnimation(newFoodX, newFoodY);
            } else {
                snake.pop();
            }

            function collision(headX, headY, array) {
                for (let i = 0; i < array.length; i++) {
                    if (headX == array[i].x && headY == array[i].y) return true;
                }
                return false;
            }

            if (snakeX < 0 || snakeX >= canvasWidth || snakeY < 0 || snakeY >= canvasHeight || collision(snakeX, snakeY, snake)) {
                clearInterval(gameLoop);
                isPlaying = false;
                playBtn.style.display = 'block';
                playBtn.innerText = "REJOUER"; // TRADUIT
                gameOverMsg.style.display = 'block';
                return;
            }

            snake.unshift({ x: snakeX, y: snakeY });
        }

        playBtn.addEventListener('click', initGame);
        
        ctx.fillStyle = "#011627";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        updateFoodDots(0);
    }


    // ==========================================
    // 3. PAGE A PROPOS (About Me)
    // ==========================================
    const bioBtn = document.getElementById('folder-bio');
    const codeDisplay = document.querySelector('.code-content');
    
    if (bioBtn && codeDisplay) {
        const contentData = {
             bio: `<p><span style="color:var(--ponctuation)">&lt;</span><span style="color:var(--balise)">!DOCTYPE html</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&lt;</span><span style="color:var(--balise)">html</span> <span style="color:var(--class)">lang</span><span style="color:var(--ponctuation)">=</span><span style="color:var(--class-name)">"fr"</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&lt;</span><span style="color:var(--balise)">head</span><span style="color:var(--ponctuation)">&gt;</span>...<span style="color:var(--ponctuation)">&lt/</span><span style="color:var(--balise)">head</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&lt;</span><span style="color:var(--balise)">body</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&lt;</span><span style="color:var(--balise)">section</span> <span style="color:var(--class)">class</span><span style="color:var(--ponctuation)">=</span><span style="color:var(--class-name)">"Bio"</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;</span><span style="color:var(--balise)">article</span> <span style="color:var(--class)">class</span><span style="color:var(--ponctuation)">=</span><span style="color:var(--class-name)">"A propos de moi"</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;</span><span style="color:var(--balise)">p</span><span style="color:var(--ponctuation)">&gt;</span><span style="color:var(--text-primary)">&nbsp;// RECHERCHE DE STAGE POUR 2 MOIS (8 SEMAINES)</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Passionné par la création web, mon objectif est simple :</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;donner vie à des projets digitaux en partant de zéro.</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fort d'une maîtrise avancée d'Illustrator et de compétences</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;solides en HTML/CSS, je suis capable de concevoir des</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;éléments visuels et de les intégrer techniquement.</span></p>
                  <br>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Je ne cherche pas seulement un stage de 8 semaines,</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;mais une opportunité de m'investir pleinement,</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;d'apprendre vite, et de contribuer activement à</span></p>
                  <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;la réussite de vos interfaces web.</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/</span><span style="color:var(--balise)">p</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/</span><span style="color:var(--balise)">article</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&nbsp;&nbsp;&lt;/</span><span style="color:var(--balise)">section</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&lt;/</span><span style="color:var(--balise)">body</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&nbsp;&nbsp;&lt;</span><span style="color:var(--balise)">footer</span><span style="color:var(--ponctuation)">&gt;</span>...<span style="color:var(--ponctuation)">&lt/</span><span style="color:var(--balise)">footer</span><span style="color:var(--ponctuation)">&gt;</span></p>
                  <p><span style="color:var(--ponctuation)">&lt;/</span><span style="color:var(--balise)">html</span><span style="color:var(--ponctuation)">&gt;</span></p>`,

            interests: `<p><span style="color:var(--const)">const</span> <span style="color:var(--const-name)">hobbies</span> <span style="color:var(--const)">=</span> <span style="color:var(--text-white)">[</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Photographie"</span><span style="color:var(--text-white)">,</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Musique"</span><span style="color:var(--text-white)">,</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Série/Animation"</span><span style="color:var(--text-white)">,</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Jeux vidéo"</span><span style="color:var(--text-white)">,</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Voyage"</span></p>
                        <p><span style="color:var(--text-white)">];</span></p>`,

            education: `<p><span style="color:var(--balise)">class</span> <span style="color:var(--class)">Expérience</span> <span style="color:var(--text-white)">{</span></p>
                        <p><span style="color:var(--text-primary)">&nbsp;&nbsp;// 2018 - 2025</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Restaurant Le Siècle d’Or"</span><span style="color:var(--text-white)">() {</span></p>
                        <p><span style="color:var(--balise)">&nbsp;&nbsp;&nbsp;&nbsp;return</span> <span style="color:var(--text-white)">[</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Salarié polyvalent",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Accueil client et prise de commande",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Préparation de boissons/apéritifs",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Encaissement"</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;];</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;}</span></p>
                        <br>
                        <p><span style="color:var(--text-primary)">&nbsp;&nbsp;// 2016 - 2018 (4 mois)</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Darty Nîmes"</span><span style="color:var(--text-white)">() {</span></p>
                        <p><span style="color:var(--balise)">&nbsp;&nbsp;&nbsp;&nbsp;return</span> <span style="color:var(--text-white)">[</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Mise en rayon multimédia",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Conseil client et vente",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Identification des besoins"</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;];</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;}</span></p>
                        <p><span style="color:var(--text-white)">}</span></p>
                        <br>
                        <p><span style="color:var(--balise)">class</span> <span style="color:var(--class)">Formation</span> <span style="color:var(--text-white)">{</span></p>
                        <p><span style="color:var(--text-primary)">&nbsp;&nbsp;// 2025 En cours...</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"My Digital School : Bachelor Web & Digital"</span><span style="color:var(--text-white)">() {</span></p>
                        <p><span style="color:var(--balise)">&nbsp;&nbsp;&nbsp;&nbsp;return</span> <span style="color:var(--text-white)">[</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Acquisition des compétences :"</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"HTML/CSS/JavaScript",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Figma/Suite Adobe : Illustrator/Photoshop/Premiere Pro",</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;];</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;}</span></p>
                        <br>
                        <p><span style="color:var(--text-primary)">&nbsp;&nbsp;// 2016 - 2018</span></p>
                        <p><span style="color:var(--class-name)">&nbsp;&nbsp;"Lycée de la CCI du Gard"</span><span style="color:var(--text-white)">() {</span></p>
                        <p><span style="color:var(--balise)">&nbsp;&nbsp;&nbsp;&nbsp;return</span> <span style="color:var(--text-white)">[</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Obtention du Bac pro Commerce mention Assez Bien"</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;&nbsp;&nbsp;];</span></p>
                        <p><span style="color:var(--text-white)">&nbsp;&nbsp;}</span></p>
                        <p><span style="color:var(--text-white)">}</span></p>`
        };

        function setContent(type, btnId) {
            if(contentData[type]) {
                codeDisplay.classList.remove('fade-in-text');
                void codeDisplay.offsetWidth; // Force Reflow
                codeDisplay.innerHTML = contentData[type];
                codeDisplay.classList.add('fade-in-text');
            }

            document.querySelectorAll('.folder-item').forEach(b => b.style.color = 'var(--text-primary)');
            const activeBtn = document.getElementById(btnId);
            if(activeBtn) activeBtn.style.color = 'var(--text-white)';
            
            const cvBtn = document.getElementById('cv-btn');
            if (cvBtn) {
                if (type === 'education') {
                    cvBtn.style.display = 'flex';
                    setTimeout(() => { cvBtn.classList.add('cv-visible'); }, 50);
                } else {
                    cvBtn.classList.remove('cv-visible');
                    setTimeout(() => {
                        if(!cvBtn.classList.contains('cv-visible')) cvBtn.style.display = 'none';
                    }, 300);
                }
            }
        }

        document.getElementById('folder-bio').addEventListener('click', () => setContent('bio', 'folder-bio'));
        document.getElementById('folder-interests').addEventListener('click', () => setContent('interests', 'folder-interests'));
        document.getElementById('folder-education').addEventListener('click', () => setContent('education', 'folder-education'));
        
        setContent('bio', 'folder-bio');
    }


    // ==========================================
    // 4. PAGE PROJETS (Filtres)
    // ==========================================
    const filterItems = document.querySelectorAll('.filter-item');
    const projects = document.querySelectorAll('.project-card');

    function applyFilters() {
        let activeTechs = [];
        document.querySelectorAll('.filter-item').forEach(f => {
            if (f.querySelector('.checkbox').classList.contains('checked')) {
                const text = f.lastChild.textContent.trim();
                activeTechs.push(text);
            }
        });

        projects.forEach(card => {
            const cardTechString = card.getAttribute('data-tech');
            const cardTechs = cardTechString ? cardTechString.split(' ') : [];

            if (activeTechs.length === 0) {
                card.style.display = 'flex';
            } else {
                const hasMatch = activeTechs.some(tech => cardTechs.includes(tech));
                if (hasMatch) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    if (filterItems.length > 0) {
        filterItems.forEach(item => {
            item.addEventListener('click', () => {
                const checkbox = item.querySelector('.checkbox');
                checkbox.classList.toggle('checked');
                applyFilters();
            });
        });
        applyFilters();
    }


    // ==========================================
    // 5. PAGE CONTACT
    // ==========================================
    const nameInput = document.getElementById('name-input');
    const emailInput = document.getElementById('email-input');
    const msgInput = document.getElementById('message-input');
    const submitBtn = document.getElementById('submit-btn');
    const formContainer = document.getElementById('form-container');
    const successContainer = document.getElementById('success-container');
    const resetBtn = document.getElementById('reset-btn');

    if (nameInput) {
        const codeName = document.getElementById('code-name');
        const codeEmail = document.getElementById('code-email');
        const codeMsg = document.getElementById('code-message');
        const codeDate = document.getElementById('code-date');
        
        // DATE EN FRANÇAIS (ex: mer. 24 déc.)
        if(codeDate) {
            const options = { weekday: 'short', day: 'numeric', month: 'short' };
            codeDate.innerText = new Date().toLocaleDateString('fr-FR', options);
        }

        function updateCodeMirror() {
            if(codeName) codeName.innerText = nameInput.value;
            if(codeEmail) codeEmail.innerText = emailInput.value;
            if(codeMsg) codeMsg.innerText = msgInput.value;
        }

        [nameInput, emailInput, msgInput].forEach(input => {
            input.addEventListener('input', updateCodeMirror);
        });

        submitBtn.addEventListener('click', () => {
            let isValid = true;

            if (nameInput.value.trim() === "") {
                nameInput.classList.add('input-error');
                document.getElementById('error-name').style.display = 'block';
                isValid = false;
            } else {
                nameInput.classList.remove('input-error');
                document.getElementById('error-name').style.display = 'none';
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value)) {
                emailInput.classList.add('input-error');
                document.getElementById('error-email').style.display = 'block';
                isValid = false;
            } else {
                emailInput.classList.remove('input-error');
                document.getElementById('error-email').style.display = 'none';
            }

            if (msgInput.value.trim() === "") {
                msgInput.classList.add('input-error');
                document.getElementById('error-message').style.display = 'block';
                isValid = false;
            } else {
                msgInput.classList.remove('input-error');
                document.getElementById('error-message').style.display = 'none';
            }

            if (isValid) {
                formContainer.style.display = 'none';
                successContainer.style.display = 'flex';
            }
        });

        if(resetBtn) {
            resetBtn.addEventListener('click', () => {
                nameInput.value = ""; emailInput.value = ""; msgInput.value = "";
                updateCodeMirror();
                successContainer.style.display = 'none';
                formContainer.style.display = 'block';
            });
        }
    }
});