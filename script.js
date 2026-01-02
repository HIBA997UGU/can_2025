// Données des équipes
const teams = {
    "MLI": { name: "Mali", flag: "https://flagcdn.com/w40/ml.png", code: "MLI" },
    "TUN": { name: "Tunisie", flag: "https://flagcdn.com/w40/tn.png", code: "TUN" },
    "SEN": { name: "Sénégal", flag: "https://flagcdn.com/w40/sn.png", code: "SEN" },
    "CIV": { name: "Côte d'Ivoire", flag: "https://flagcdn.com/w40/ci.png", code: "CIV" },
    "EGY": { name: "Égypte", flag: "https://flagcdn.com/w40/eg.png", code: "EGY" },
    "CMR": { name: "Cameroun", flag: "https://flagcdn.com/w40/cm.png", code: "CMR" },
    "NGA": { name: "Nigeria", flag: "https://flagcdn.com/w40/ng.png", code: "NGA" },
    "ALG": { name: "Algérie", flag: "https://flagcdn.com/w40/dz.png", code: "ALG" },
    "MAR": { name: "Maroc", flag: "https://flagcdn.com/w40/ma.png", code: "MAR" },
    "RSA": { name: "Afrique du Sud", flag: "https://flagcdn.com/w40/za.png", code: "RSA" },
    "COD": { name: "Congo DR", flag: "https://flagcdn.com/w40/cd.png", code: "COD" },
    "BEN": { name: "Bénin", flag: "https://flagcdn.com/w40/bj.png", code: "BEN" },
    "BFA": { name: "Burkina Faso", flag: "https://flagcdn.com/w40/bf.png", code: "BFA" },
    "TAN": { name: "Tanzanie", flag: "https://flagcdn.com/w40/tz.png", code: "TAN" },
    "MOZ": { name: "Mozambique", flag: "https://flagcdn.com/w40/mz.png", code: "MOZ" },
    "SUD": { name: "Soudan", flag: "https://flagcdn.com/w40/sd.png", code: "SUD" }
};

// Structure des prédictions
let predictions = {
    huitiemes: {},
    quarts: {},
    demis: {},
    finale: {},
    champion: null
};

// Notification
const notification = document.getElementById('notification');
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'notification show';
    notification.style.background = type === 'success' 
        ? 'linear-gradient(45deg, #2ECC71, #27AE60)' 
        : type === 'error' 
        ? 'linear-gradient(45deg, #E74C3C, #C0392B)' 
        : 'linear-gradient(45deg, var(--primary), var(--secondary))';
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Charger les prédictions
function loadPredictions() {
    const saved = localStorage.getItem('canPredictions2025');
    if(saved) {
        predictions = JSON.parse(saved);
        updateUIFromPredictions();
        updateSummary();
        showNotification('Prédictions chargées avec succès !', 'success');
    }
}

// Sauvegarder les prédictions
function savePredictions() {
    localStorage.setItem('canPredictions2025', JSON.stringify(predictions));
    updateSummary();
    showNotification('Prédictions sauvegardées !', 'success');
}

// Remplir un slot
function fillSlotWithTeam(slotId, teamData) {
    const slot = document.getElementById(slotId);
    if(!slot) return;

    slot.innerHTML = '';
    slot.classList.add('filled');

    const teamDiv = document.createElement('div');
    teamDiv.className = 'team-in-slot';

    const flagImg = document.createElement('img');
    flagImg.src = teamData.flag;
    flagImg.alt = teamData.name;
    flagImg.className = 'team-flag';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'team-name';
    nameSpan.textContent = teamData.name;

    teamDiv.appendChild(flagImg);
    teamDiv.appendChild(nameSpan);
    slot.appendChild(teamDiv);

    slot.dataset.teamCode = teamData.code;
}

// Mettre à jour UI
function updateUIFromPredictions() {
    document.querySelectorAll('.team, .slot').forEach(el => el.classList.remove('selected','filled','winner'));

    document.querySelectorAll('.slot').forEach(slot => {
        const id = slot.id;
        if(id.startsWith('qf')) slot.innerHTML = `<div class="placeholder">Vainqueur<br>Match ${id.replace('qf','')}</div>`;
        else if(id.startsWith('sf')) slot.innerHTML = `<div class="placeholder">Vainqueur<br>Quart ${Math.ceil(id.replace('sf','')/2)}</div>`;
        else if(id.startsWith('final')) slot.innerHTML = `<div class="placeholder">Vainqueur<br>Demi ${id.replace('final','')}</div>`;
        else if(id==='champion') slot.innerHTML = `<div class="placeholder">CHAMPION</div>`;
        delete slot.dataset.teamCode;
    });

    // Appliquer prédictions
    Object.keys(predictions.huitiemes).forEach(matchKey => {
        const teamCode = predictions.huitiemes[matchKey];
        const teamEl = document.querySelector(`[data-team-code="${teamCode}"]`);
        if(teamEl) teamEl.classList.add('selected','winner');
    });
    ['quarts','demis','finale'].forEach(round => {
        Object.keys(predictions[round]).forEach(slotId => {
            fillSlotWithTeam(slotId, teams[predictions[round][slotId]]);
        });
    });
    if(predictions.champion) fillSlotWithTeam('champion', teams[predictions.champion]);
}

// Gérer clic sur équipe
function handleTeamClick(teamEl) {
    const teamCode = teamEl.dataset.teamCode;
    if(teamEl.classList.contains('selected')) return;

    const match = teamEl.closest('.match');
    match.querySelectorAll('.team').forEach(t => t.classList.remove('selected','winner'));
    teamEl.classList.add('selected','winner');

    const teamId = teamEl.id;
    const matchNum = parseInt(teamId.replace('m',''));
    const matchKey = `match${Math.ceil(matchNum/2)}`;

    let targetSlotId;
    if(matchNum <= 8) targetSlotId = `qf${Math.ceil(matchNum/2)}`;
    else targetSlotId = `qf${Math.ceil((matchNum-8)/2)+4}`;

    fillSlotWithTeam(targetSlotId, teams[teamCode]);
    predictions.huitiemes[matchKey] = teamCode;
    predictions.quarts[targetSlotId] = teamCode;

    clearLaterRounds('quarts');
    savePredictions();
    showNotification(`${teams[teamCode].name} avance en quarts de finale !`, 'success');
}

// Gérer clic sur slot
function handleSlotClick(slotEl) {
    const slotId = slotEl.id;
    const teamCode = slotEl.dataset.teamCode;
    if(!teamCode) { showNotification('Ce slot est vide !','info'); return; }

    let targetSlotId, roundType;

    if(slotId.startsWith('qf')) { 
        const quarterNum = parseInt(slotId.replace('qf',''));
        const semiNum = Math.ceil(quarterNum/2);
        targetSlotId = `sf${semiNum}`; roundType='demis';
    } else if(slotId.startsWith('sf')) {
        const semiNum = parseInt(slotId.replace('sf',''));
        const finalNum = Math.ceil(semiNum/2);
        targetSlotId = `final${finalNum}`; roundType='finale';
    } else if(slotId.startsWith('final')) { 
        targetSlotId='champion'; roundType='champion'; 
    } else return;

    const targetSlot = document.getElementById(targetSlotId);
    if(!targetSlot) { showNotification('Slot suivant non trouvé','error'); return; }

    fillSlotWithTeam(targetSlotId, teams[teamCode]);

    if(roundType==='demis') predictions.demis[targetSlotId]=teamCode;
    else if(roundType==='finale') predictions.finale[targetSlotId]=teamCode;
    else if(roundType==='champion') { 
        predictions.champion=teamCode; 
        showNotification(`🎉 ${teams[teamCode].name} est couronné champion !`,'success'); 
    }

    if(roundType!=='champion') clearLaterRounds(roundType);
    slotEl.classList.add('winner');
    savePredictions();
}

// Effacer tours suivants
function clearLaterRounds(fromRound) {
    const rounds=['huitiemes','quarts','demis','finale','champion'];
    const startIndex = rounds.indexOf(fromRound)+1;

    for(let i=startIndex;i<rounds.length;i++){
        const round = rounds[i];
        if(round==='demis'){ 
            predictions.demis={}; 
            document.querySelectorAll('.semi-slot').forEach(slot=>{ 
                slot.innerHTML=`<div class="placeholder">Vainqueur<br>Quart ${Math.ceil(slot.id.replace('sf','')/2)}</div>`; 
                slot.classList.remove('filled','winner'); 
                delete slot.dataset.teamCode; 
            }); 
        }
        if(round==='finale'){ 
            predictions.finale={}; 
            document.querySelectorAll('.final-slot').forEach(slot=>{ 
                slot.innerHTML=`<div class="placeholder">Vainqueur<br>Demi ${slot.id.replace('final','')}</div>`; 
                slot.classList.remove('filled','winner'); 
                delete slot.dataset.teamCode; 
            }); 
        }
        if(round==='champion'){ 
            predictions.champion=null; 
            const slot=document.getElementById('champion'); 
            if(slot){ 
                slot.innerHTML='<div class="placeholder">CHAMPION</div>'; 
                slot.classList.remove('filled','winner'); 
                delete slot.dataset.teamCode; 
            } 
        }
    }
}

// Réinitialiser tout
function resetAll() {
    if(confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos prédictions ?')){
        predictions={huitiemes:{},quarts:{},demis:{},finale:{},champion:null};
        document.querySelectorAll('.team,.slot').forEach(el=>el.classList.remove('selected','filled','winner'));
        document.querySelectorAll('.slot').forEach(slot=>{
            const id=slot.id;
            if(id.startsWith('qf')) slot.innerHTML=`<div class="placeholder">Vainqueur<br>Match ${id.replace('qf','')}</div>`;
            else if(id.startsWith('sf')) slot.innerHTML=`<div class="placeholder">Vainqueur<br>Quart ${Math.ceil(id.replace('sf','')/2)}</div>`;
            else if(id.startsWith('final')) slot.innerHTML=`<div class="placeholder">Vainqueur<br>Demi ${id.replace('final','')}</div>`;
            else if(id==='champion') slot.innerHTML=`<div class="placeholder">CHAMPION</div>`;
            delete slot.dataset.teamCode;
        });
        localStorage.removeItem('canPredictions2025');
        updateSummary();
        showNotification('Toutes les prédictions ont été réinitialisées !','info');
    }
}

// Résumé des prédictions
function updateSummary(){
    const summaryContent=document.getElementById('summaryContent');
    if(!summaryContent) return;

    let summaryHTML='';
    if(Object.keys(predictions.huitiemes).length===0) summaryHTML='<p>Aucune prédiction enregistrée</p>';
    else{
        summaryHTML+='<div class="summary-section"><h4>Huitièmes de finale :</h4>';
        Object.keys(predictions.huitiemes).forEach(k=>summaryHTML+=`<p>${k}: ${teams[predictions.huitiemes[k]].name}</p>`);
        summaryHTML+='</div>';

        if(Object.keys(predictions.quarts).length>0){
            summaryHTML+='<div class="summary-section"><h4>Quarts de finale :</h4>';
            Object.keys(predictions.quarts).forEach(k=>summaryHTML+=`<p>${k}: ${teams[predictions.quarts[k]].name}</p>`);
            summaryHTML+='</div>';
        }

        if(Object.keys(predictions.demis).length>0){
            summaryHTML+='<div class="summary-section"><h4>Demi-finales :</h4>';
            Object.keys(predictions.demis).forEach(k=>summaryHTML+=`<p>${k}: ${teams[predictions.demis[k]].name}</p>`);
            summaryHTML+='</div>';
        }

        if(Object.keys(predictions.finale).length>0){
            summaryHTML+='<div class="summary-section"><h4>Finale :</h4>';
            Object.keys(predictions.finale).forEach(k=>summaryHTML+=`<p>${k}: ${teams[predictions.finale[k]].name}</p>`);
            summaryHTML+='</div>';
        }

        if(predictions.champion) summaryHTML+=`<div class="champion-summary"><strong>🏆 Champion :</strong> ${teams[predictions.champion].name}</div>`;
    }
    summaryContent.innerHTML=summaryHTML;
}

// ============================================
function captureFullBracket() {
    // Vérifier si html2canvas est disponible
    if (typeof html2canvas === 'undefined') {
        showNotification('Erreur: html2canvas n\'est pas chargé', 'error');
        return;
    }

    // Vérifier s'il y a des prédictions
    if (Object.keys(predictions.huitiemes).length === 0) {
        showNotification('Aucune prédiction à télécharger. Faites d\'abord vos prédictions !', 'info');
        return;
    }

    showNotification('📸 Capture du tableau en cours...', 'info');
    
    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capture...';

    // Récupérer l'élément à capturer (tournament-section)
    const tournamentSection = document.querySelector('.tournament-section');
    
    // Créer un clone pour la capture
    const clone = tournamentSection.cloneNode(true);
    
    // Appliquer des styles temporaires au clone pour le centrer
    clone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: auto;
        background: #0F1923;
        padding: 40px;
        z-index: 9999;
        overflow: auto;
        margin: 0 !important;
        transform: none !important;
    `;
    
    // Supprimer les éléments inutiles du clone
    const elementsToRemove = clone.querySelectorAll('.action-buttons, .legend, #predictionsSummary');
    elementsToRemove.forEach(el => el.remove());
    
    // Ajouter un titre au début
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: rgba(212, 175, 55, 0.1);
        border-radius: 10px;
        border: 2px solid #D4AF37;
    `;
    
    titleDiv.innerHTML = `
        <h1 style="color: #D4AF37; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">
            PRÉDICTIONS CAN 2025
        </h1>
        <div style="color: white; font-size: 18px; margin-bottom: 10px;">
            Coupe d'Afrique des Nations - Maroc 2025
        </div>
        <div style="color: #C1272D; font-size: 16px; font-weight: bold;">
            Capturé le ${new Date().toLocaleDateString('fr-FR')}
        </div>
    `;
    
    // Insérer le titre au début du clone
    clone.insertBefore(titleDiv, clone.firstChild);
    
    // Ajouter le clone au body
    document.body.appendChild(clone);

    // Attendre que le clone soit rendu
    setTimeout(() => {
        html2canvas(clone, {
            backgroundColor: '#0F1923',
            scale: 0.8, // 80% de la taille originale
            useCORS: true,
            logging: false,
            width: clone.scrollWidth,
            height: clone.scrollHeight,
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight
        }).then(canvas => {
            // Nettoyer le clone
            document.body.removeChild(clone);
            
            // Créer le lien de téléchargement
            const link = document.createElement('a');
            const date = new Date();
            const fileName = `CAN-Predictions-${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}.png`;
            
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            
            // Déclencher le téléchargement
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Réactiver le bouton
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
            
            showNotification('✅ Capture réussie ! Image téléchargée.', 'success');
            
        }).catch(error => {
            console.error('Erreur lors de la capture:', error);
            
            // Nettoyer en cas d'erreur
            if (document.body.contains(clone)) {
                document.body.removeChild(clone);
            }
            
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
            
            showNotification('❌ Erreur lors de la capture', 'error');
        });
    }, 500);
}
// FONCTION POUR PARTAGER
// ============================================

function sharePredictions() {
    if (navigator.share) {
        navigator.share({
            title: 'Mes prédictions CAN 2025',
            text: 'Découvrez mes prédictions pour la Coupe d\'Afrique des Nations 2025 au Maroc! 🏆🇲🇦',
            url: window.location.href
        })
        .then(() => showNotification('✅ Partage réussi!', 'success'))
        .catch(error => {
            console.log('Erreur de partage:', error);
            copyToClipboard();
        });
    } else {
        copyToClipboard();
    }
}

function copyToClipboard() {
    const link = window.location.href;
    navigator.clipboard.writeText(link + '\n\nVoici mes prédictions pour la CAN 2025! 🏆')
        .then(() => {
            showNotification('✅ Lien copié dans le presse-papier!', 'success');
        })
        .catch(err => {
            console.error('Erreur:', err);
            showNotification('❌ Impossible de copier le lien', 'error');
        });
}

// ============================================
// FONCTION POUR VICTOIRE AUTO DU MAROC
// ============================================

function autoMarocWin() {
    if (confirm('Cette action va automatiquement prédire la victoire du Maroc jusqu\'en finale. Continuer?')) {
        resetAll();
        
        setTimeout(() => {
            const marocCodes = ['m13', 'm14'];
            marocCodes.forEach(code => {
                const team = document.getElementById(code);
                if (team && team.dataset.teamCode === 'MAR') {
                    handleTeamClick(team);
                }
            });
            
            setTimeout(() => {
                const qfSlots = ['qf5', 'qf6', 'qf7', 'qf8'];
                qfSlots.forEach(slotId => {
                    const slot = document.getElementById(slotId);
                    if (slot && slot.dataset.teamCode === 'MAR') {
                        handleSlotClick(slot);
                    }
                });
                
                setTimeout(() => {
                    const sfSlots = ['sf3', 'sf4'];
                    sfSlots.forEach(slotId => {
                        const slot = document.getElementById(slotId);
                        if (slot && slot.dataset.teamCode === 'MAR') {
                            handleSlotClick(slot);
                        }
                    });
                    
                    setTimeout(() => {
                        const finalSlots = ['final1', 'final2'];
                        finalSlots.forEach(slotId => {
                            const slot = document.getElementById(slotId);
                            if (slot && slot.dataset.teamCode === 'MAR') {
                                handleSlotClick(slot);
                            }
                        });
                        
                        setTimeout(() => {
                            const championSlot = document.getElementById('champion');
                            if (championSlot && championSlot.dataset.teamCode === 'MAR') {
                                handleSlotClick(championSlot);
                            }
                        }, 300);
                    }, 300);
                }, 300);
            }, 300);
            
            showNotification('✅ Parcours du Maroc prédit automatiquement!', 'success');
        }, 100);
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function(){
    // Événements pour les équipes et slots
    document.querySelectorAll('.team').forEach(team => team.addEventListener('click', () => handleTeamClick(team)));
    document.querySelectorAll('.slot').forEach(slot => slot.addEventListener('click', () => handleSlotClick(slot)));
    
    // Boutons principaux
    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn) saveBtn.addEventListener('click', savePredictions);
    
    const resetBtn = document.getElementById('resetBtn');
    if(resetBtn) resetBtn.addEventListener('click', resetAll);
    
    const autoMarocBtn = document.getElementById('autoMarocBtn');
    if(autoMarocBtn) autoMarocBtn.addEventListener('click', autoMarocWin);
    
    // Boutons de téléchargement et partage
    const downloadBtn = document.getElementById('downloadBtn');
    if(downloadBtn) downloadBtn.addEventListener('click', captureFullBracket);
    
    const shareBtn = document.getElementById('shareBtn');
    if(shareBtn) shareBtn.addEventListener('click', sharePredictions);
    
    // Charger les prédictions sauvegardées
    loadPredictions();
    
    // Navigation mobile
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Smooth scrolling pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});